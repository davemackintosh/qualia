class Qualia extends HTMLElement {

  static get tag() {
    return t7;
  }

  /**
   * Register a new element and it's class.
   * @param {String} name of the element.
   * @param {Function} element_class to register.
   */
  static register(element) {
    if (!element) throw new ReferenceError("Cannot register null or undefined. Qualia.register(Qualia)");

    // Try to get the script scope.
    const script = document.currentScript;

    // Check there's a script at all.
    if (!script) {
      console.error("Please don't import this file in your <head>. Importing should be done per component so Qualia can get the right scope.", element);
      return;
    }

    // Get the current document scope.
    const doc = script.ownerDocument;

    if (!doc) {
      console.error("Please don't import this file in your <head>. Importing should be done per component so Qualia can get the right scope.", element);
      return;
    }

    // Make sure we have a document variable.
    element.prototype.document = doc;

    // Get the template.
    const template = doc.querySelector("template[name]");

    // Check there's a template.
    if (!template) {
      console.warn("No template found for this webcomponent. Please add a <template name=> to your module.");
      return;
    }

    // Try to get the module's name from it's template.
    const name = template.getAttribute("name");

    // Check it has a value.
    if (!name) {
      console.warn("No name attribute found on your <template> please add a `name` attribute.");
      return;
    }

    // Finally, register the custom element.
    document.registerElement(name, element);
  }

  add_events(node) {
    if (!node.hasOwnProperty("attrs")) return node;

    const events = ["blur", "change", "click", "contextmenu", "dblclick", "error", "focus", "focusin", "focusout", "input", "keydown", "keypress", "keyup", "load", "mousedown", "mouseup", "resize", "select", "submit", "touchcancel", "touchend", "touchstart", "unload"];

    Object.keys(node.attrs).filter(attribute_name => events.indexOf(attribute_name.replace(/^on/g, "")) > -1).forEach(attribute_name => {
      const func = node.attrs[attribute_name];

      if (!this[func] || !(this[func] instanceof Function)) console.warn(`not setting up listener "${ attribute_name }" as the handler "${ func }->${ this[func] }" either:\n\t 1. could not be found.\n\t 2. Is not a function.\n`, this);else node.attrs[attribute_name] = this[func].bind(this);
    });

    return node;
  }

  fix_t7_object(node) {
    if (!node) return new virtualDom.VText("");

    if (node instanceof Array) return node.map(this.fix_t7_object.bind(this));

    if (!node.hasOwnProperty("tag")) return new virtualDom.VText(node);

    // Fix the type.
    if (typeof node.children === "undefined") node.children = "";else if (node.children instanceof Array) node.children = node.children.map(this.fix_t7_object.bind(this));else if (String(node.children) == node.children) node.children = new virtualDom.VText(node.children);

    node = this.add_events(node);

    // Return.
    return new virtualDom.h(node.tag, node.attrs, node.children);
  }

  fix_t7_vtree(original_tree) {
    let tree = Object.assign({}, original_tree);

    return this.fix_t7_object(tree);
  }

  onRendered() {}
  render() {
    if (!this._template) {
      console.warn("Nothing to render to", this);
      return this;
    }

    this.remove_scripts();

    const compiled = this.fix_t7_vtree(eval("t7`<div>" + this._template.innerHTML.replace(/=&gt;/g, "=>") + "</div>`"));

    if (!this.vtree) {
      this.vtree = virtualDom.createElement(compiled, {
        warn: console.warn.bind(console)
      });

      this._root.appendChild(this.vtree);
    } else {
      const patches = virtualDom.diff(this.vtree, compiled);
      console.log(patches);
      this.vtree = virtualDom.patch(this.vtree, patches);
    }

    if (this.onRendered) this.onRendered();

    return this;
  }

  // Simple wrappers.
  attached() {}
  attachedCallback() {
    this.render();
    this.attached();
  }

  detached() {}
  detachedCallback() {
    this.detached();
  }

  attributeChanged() {}
  attributeChangedCallback(attr_name, prev, current, namespace) {
    this.attributeChanged && this.attributeChanged(attr_name, prev, current, namespace);

    if (prev !== current) this.props[attr_name] = this.resolve_attribute_change(attr_name, current);
  }

  remove_scripts() {
    if (!this._template) return;

    const scripts = this._template.content.querySelectorAll("script");

    if (scripts.length > 0) {
      console.warn("Cannot have scripts in the template for security and performance.\n\n If you're trying to set up listeners, use instance methods and on[event]='classInstanceMethod'.\n Removing your script.");
      let remaining_scripts = scripts.length;
      while (remaining_scripts--) {
        const script = scripts[remaining_scripts];
        script.parentNode.removeChild(script);
      }
    }
  }

  created() {}
  createdCallback() {
    t7.setOutput(t7.Outputs.Universal);

    // Get a few things
    this._template = this.document.querySelector("template[name]");

    if (!this._template) {
      console.warn("No template was found for this element, cannot proceed or attach.", this);
      return;
    }

    this.remove_scripts();

    // Get the template and the shadow dom.
    if (this.SHADOW) {
      this._root = this.createShadowRoot();

      // Add the template to the shadow dom.
      document.importNode(this._template.content, true);
    } else this._root = this;

    const self = this;

    this.props = {};

    // Resolve any declared attributes.
    this.resolve_attrs();

    // Update the props with a proxy.
    this.props = new Proxy(Object.assign({}, this.defaults, this.props), {
      set(target, key, value) {
        if (target[key] !== value) {
          target[key] = value;
          self.render();
        }
        return true;
      },
      get(target, key) {
        return target[key];
      }
    });

    // Fire the callback.
    this.created();
  }

  resolve_attribute_change(name, value) {
    if (!this.attrs.hasOwnProperty(name)) {
      console.warn(`could not find attribute "${ name }" in the defined attributes for this component. Please check for spelling errors or define this attribute and it's type.`, this.attrs);
      return null;
    }

    const attr = this.attrs[name];
    let out;

    const type = attr.type || attr;

    // What is it?
    switch (type) {
      case Number:
        out = Number(value);
        break;
      case Array:
      case Object:
        out = JSON.parse(value.toString());
        break;
      case Date:
        out = new Date(value);
        break;
      case RegExp:
        out = new RegExp(value.toString());
        break;
      case Boolean:
        out = ["true", "yes", name].indexOf(attr.toString()) > -1 ? true : false;
        break;
      case String:
        out = value.toString();
        break;
      default:
        out = new this.attrs[name]();
    }

    return out;
  }

  resolve_attrs() {
    this.defaults = {};

    // Loop over the declarations.
    Object.keys(this.attrs).forEach(attr_name => {
      // Try to get the attribute.
      let attr = this.getAttribute(attr_name);
      const def = this.attrs[attr_name];

      // Get the type of attribute.
      const type = def.type || def;

      // Check the attribute isn't undefined.
      // If it is, set it to null and continue iterating.
      if (typeof attr === "undefined" || attr === null) {
        this.defaults[attr_name] = new type();
        return;
      }

      // What is it?
      switch (type) {
        case Number:
          attr = Number(attr);
          break;
        case Array:
        case Object:
          attr = JSON.parse(attr.toString());
          break;
        case Date:
          attr = new Date(attr);
          break;
        case RegExp:
          attr = new RegExp(attr.toString());
          break;
        case Boolean:
          attr = ["true", "yes", attr_name].indexOf(attr.toString()) > -1 ? true : false;
          break;
        case String:
          attr = attr.toString();
          break;
        default:
          attr = new this.attrs[attr_name]();
      }

      if (def.default) this.defaults[attr_name] = def.default;else this.defaults[attr_name] = new type();

      // Set the property.
      this.props[attr_name] = attr;
    });
  }
}

if (typeof define === "function" && define.amd) define(["qualia"], Qualia);else if (typeof module === "object" && module.exports) module.exports = require("qualia");else this.Qualia = Qualia;
