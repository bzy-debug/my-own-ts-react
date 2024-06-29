declare namespace JSX {
  interface IntrinsicElements {
    [index: string]: unknown
  }
}

type DidactElement = {
  type: string
  props: {
    [index: string]: unknown
    children: DidactElement[]
  }
}

type Fiber = DidactElement & {
  dom?: Node
  child?: Fiber
  sibling?: Fiber
  parent?: Fiber
}

function createTextElement(text: string): DidactElement {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

function createElement(
  type: string,
  props: Record<string, unknown> | null,
  ...children: (string | DidactElement)[]
): DidactElement {
  const element = {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === 'string' ? createTextElement(child) : child,
      ),
    },
  }
  return element
}

let nextUnitOfWork: Fiber | null = null

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false

  while (nextUnitOfWork !== null && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber: Fiber | null): Fiber | null {
  if (fiber === null) {
    return null
  }
  if (fiber.dom === undefined) {
    fiber.dom = createDom(fiber)
  }
  if (fiber.parent !== undefined) {
    fiber.parent.dom?.appendChild(fiber.dom)
  }

  let preSibling: Fiber | null = null

  for (const element of fiber.props.children) {
    const newFiber = {
      ...element,
      parent: fiber,
    }

    if (preSibling === null) {
      fiber.child = newFiber
    } else if (preSibling !== null) {
      preSibling.sibling = newFiber
    }
    preSibling = newFiber
  }

  if (fiber.child !== undefined) {
    return fiber.child
  }

  let nextFiber: Fiber | undefined = fiber

  while (nextFiber !== undefined) {
    if (nextFiber.sibling !== undefined) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

  return null
}

let x = 0

function createDom(fiber: DidactElement): Node {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)
  for (const key in fiber.props) {
    if (key !== 'children') {
      dom[key] = fiber.props[key]
    }
  }

  if (dom instanceof HTMLElement) {
    dom.style.backgroundColor = `rgba(0, 0, 0, ${x})`
    x += 0.1
  }

  return dom
}

function render(element: DidactElement, container: Node): void {
  nextUnitOfWork = {
    type: container.nodeName.toLowerCase(),
    props: {
      children: [element],
    },
    dom: container,
  }
}

const Didact = {
  createElement,
  render,
}

const e = (
  <div id="foo" foo="bar" className="class-1">
    <div>
      <p>1</p>
      <p>2</p>
    </div>
    <p>
      xxx <strong>yyy</strong>
    </p>
  </div>
)

const app = document.getElementById('app')!

Didact.render(e, app)
