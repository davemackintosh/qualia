// @flow

declare class HTMLTemplateElement extends HTMLElement {
  content: DocumentFragment;
}

declare class DocumentFragmentShadowEnabled extends DocumentFragment {
  innerHTML: String
}
