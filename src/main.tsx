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

function createDom(fiber: Fiber): Node | undefined {
  if (!fiber.type) return;

  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key: string) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = fiber.props[name];
    });

  return dom;
}

type Fiber = DidactElement & {
  dom: Node | null;
  parent: Fiber | null;
  sibling: Fiber | null;
  child: Fiber | null;
};

function commitRoot() {
  commitWork(wipRoot);
  wipRoot = null;
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) return;

  fiber.parent?.dom?.appendChild(fiber.dom!);
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function render(element: DidactElement, container: HTMLElement) {
  wipRoot = {
    type: "root",
    props: {
      children: [element],
    },
    dom: container,
    parent: null,
    child: null,
    sibling: null,
  };

  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork: null | Fiber = null;
let wipRoot: null | Fiber = null;

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork(fiber: Fiber): Fiber | null {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)!;
  }
  // TODO create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: Fiber | null = null;

  while (index < elements.length) {
    const element = elements[index];
    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: fiber,
      sibling: null,
      child: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
  // TODO return next unit of work
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return nextFiber;
}

const Didact = {
  createElement,
  render,
};

(window as any).Didact = Didact;

const fiber = (
  <div>
    <h1>Hello World</h1>
    <label htmlFor="search">Search: </label>
    <input type="text" id="search" />
  </div>
);

const container = document.getElementById("app")!;

Didact.render(fiber, container);
