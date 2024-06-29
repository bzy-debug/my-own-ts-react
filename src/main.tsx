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
  alternate?: Fiber
  effectTag?: 'UPDATE' | 'PLACEMENT' | 'DELETION'
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
  props: Record<string, unknown> | undefined,
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

let nextUnitOfWork: Fiber | undefined = undefined
let wipRoot: Fiber | undefined = undefined
let currentRoot: Fiber | undefined = undefined
let deletions: Fiber[] = []

function commitRoot(): void {
  if (wipRoot === undefined) return
  deletions.forEach(commitWork)
  commitWork(wipRoot.child)
  currentRoot = wipRoot
  wipRoot = undefined
}

const isEvent = key => key.startsWith('on')
const isProperty = key => key !== 'children' && !isEvent(key)
const isNew =
  (prev: Record<string, unknown>, next: Record<string, unknown>) =>
  (key: string) =>
    prev[key] !== next[key]
const isGone =
  (_prev: Record<string, unknown>, next: Record<string, unknown>) =>
  (key: string) =>
    !(key in next)

function updateDom(
  dom: Node,
  prevProps: Record<string, unknown>,
  nextProps: Record<string, unknown>,
) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        isGone(prevProps, nextProps)(key) || isNew(prevProps, nextProps)(key),
    )
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.removeEventListener(eventType, prevProps[name] as EventListener)
    })

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ''
    })

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name] as EventListener)
    })
}

let f

function commitWork(fiber: Fiber | undefined) {
  if (fiber?.dom === undefined || fiber.parent?.dom === undefined) return
  const domParent = fiber.parent.dom

  if (fiber.effectTag === 'PLACEMENT') {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  } else if (fiber.effectTag === 'UPDATE') {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props)
  }

  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline: IdleDeadline): void {
  let shouldYield = false

  while (nextUnitOfWork !== undefined && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (nextUnitOfWork === undefined && wipRoot !== undefined) {
    commitRoot()
  }

  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber: Fiber | undefined): Fiber | undefined {
  if (fiber === undefined) {
    return undefined
  }
  if (fiber.dom === undefined) {
    fiber.dom = createDom(fiber)
  }

  const elements = fiber.props.children

  reconcileChildren(fiber, elements)

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

  return undefined
}

function reconcileChildren(wipFiber: Fiber, elements: DidactElement[]) {
  let index = 0
  let preSibling: Fiber | undefined
  let oldFiber = wipFiber.alternate?.child

  while (index < elements.length || oldFiber !== undefined) {
    const element = elements[index]
    let newFiber: Fiber | undefined = undefined

    const sameType =
      element !== undefined &&
      oldFiber !== undefined &&
      element.type === oldFiber?.type

    if (element !== undefined && oldFiber !== undefined && sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      }
    }

    if (element !== undefined && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        effectTag: 'PLACEMENT',
      }
    }

    if (oldFiber !== undefined && !sameType) {
      oldFiber.effectTag = 'DELETION'
      deletions.push(oldFiber)
    }

    if (oldFiber !== undefined) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (element !== undefined) {
      if (preSibling !== undefined) {
        preSibling.sibling = newFiber
      }
    }
    preSibling = newFiber
    index++
  }
}

function createDom(fiber: DidactElement): Node {
  const dom =
    fiber.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type)

  updateDom(dom, {}, fiber.props)

  return dom
}

function render(element: DidactElement, container: Node): void {
  wipRoot = {
    type: container.nodeName.toLowerCase(),
    props: {
      children: [element],
    },
    dom: container,
    alternate: currentRoot,
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

const Didact = {
  createElement,
  render,
}

const e1 = (
  <div id="foo" foo="bar" className="class-1">
    <div>
      <p
        onclick={() => {
          console.log(1)
        }}
      >
        1
      </p>
      <p>2</p>
    </div>
    <p>
      xxx <strong>yyy</strong>
    </p>
  </div>
)

const e2 = (
  <div id="foo" foo="bar" className="class-1">
    <div>
      <p
        onclick={() => {
          console.log(2)
        }}
      >
        1
      </p>
      <p>2</p>
    </div>
  </div>
)

const app = document.getElementById('app')!

Didact.render(e1, app)

setTimeout(() => {
  Didact.render(e2, app)
}, 2000)
