# qualia

A web components virtual dom framework. Write native web components, get virtual dom 💪

> In philosophy and certain models of psychology, qualia (/ˈkwɑːliə/ or /ˈkweɪliə/; singular form: quale) are individual instances of subjective, conscious experience. The term "qualia" derives from the Latin neuter plural form (qualia) of the Latin adjective quālis (Latin pronunciation: [ˈkʷaːlɪs]) meaning "of what sort" or "of what kind").

This is just me experimenting with and learning virtual dom, it's used in another side project of mine (Melodist)

It converts your `<template>` into an ES6 template literal so you can use vanilla expressions in your template, it then renders the component as a virtual dom component for performance.

It also watches the `props` attribute and renders the necessary patches automatically.  

It also supports automatic `props` updates via it's attributes.

It targets Chrome only at the moment (for an Electron app)

I welcome and appreciate any PRs ❤

It's built on [t7](https://github.com/trueadm/t7) & [virtual dom](https://github.com/Matt-Esch/virtual-dom)

*Example:*

```html
<!-- my-element.html -->
<link rel="import" href="./vendor/qualia/dist/qualia.html" />

<template name="my-element">
  <h1>${this.props.title}</h1>

  ${this.props.paragraphs.map(paragraph => Qualia.tag`
    <p>${paragraph}</p>
  `)}
</template>

<script>
  class MyElement extends Qualia {
    get attrs() {
      return {
        title: {
          type: String,
          default: "Qualia Web Components &amp; Virtual Dom"
        },
        paragraphs: Array
      }
    }

    onRendered() {
      console.log("Rendered!")
    }
  }

  Qualia.register(MyElement)
</script>
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Qualia</title>
    <link rel="import" href="./elements/my-element.html">
  </head>
  <body>
    <my-element title="Qualia Web Components." paragraphs="[1, 2, 3, 4, 5, 6]"></my-element>
  </body>
</html>
```
