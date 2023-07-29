// const element = <h1 title="foo">Hello</h1>
// const container = document.getElementById("root")
// ReactDOM.render(element, container)

declare namespace JSX {
  interface IntrinsicElements {
    [index: string]: any;
  }
}

type DidactElement = {
  type: string;
  props: Record<string, unknown>;
};

function createElement(
  type: string,
  props?: Record<string, unknown>,
  ...children: (DidactElement | string)[]
): DidactElement {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        if (typeof child === "object") {
          return child;
        } else {
          return createTextElement(child);
        }
      }),
    },
  };
}

function createTextElement(text: string): DidactElement {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

const Didact = {
  createElement,
};

const element = <h1>Hello World</h1>;

const container = document.getElementById("app")!;
