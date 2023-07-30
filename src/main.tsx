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
  props: Record<string, unknown> & { children: DidactElement[] };
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

function render(element: DidactElement, container: HTMLElement) {
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);

  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = element.props[name];
    });

  element.props.children.forEach((child) => render(child, dom as HTMLElement));

  container.appendChild(dom);
}

// let nextUnitOfWork = null;

// function workLoop(deadline: IdleDeadline) {
//   let shouldYield = false;
//   while (nextUnitOfWork && !shouldYield) {
//     nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
//     shouldYield = deadline.timeRemaining() < 1;
//   }
//   requestIdleCallback(workLoop);
// }

// requestIdleCallback(workLoop);

// function performUnitOfWork(nextUnitOfWork) {}

const Didact = {
  createElement,
  render,
};

(window as any).Didact = Didact;

const element = (
  <div>
    <h1>Hello World</h1>
    <label htmlFor="search">Search: </label>
    <input type="text" id="search" />
  </div>
);

const container = document.getElementById("app")!;

Didact.render(element, container);
