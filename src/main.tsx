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

function createTextElement(text: string): DidactElement {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  }
}

const Didact = {
  createElement: (
    type: string,
    props: Record<string, unknown> | null,
    ...children: (string | DidactElement)[]
  ): DidactElement => {
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
  },

  render(element: DidactElement, container: HTMLElement | Text) {
    const node =
      element.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(element.type)

    for (const key in element.props) {
      if (key !== 'children') {
        node[key] = element.props[key]
      }
    }
    for (const child of element.props.children) {
      this.render(child, node)
    }
    container.appendChild(node)
  },
}

const e = (
  <div id="foo" foo="bar" className="class-1">
    <h1>Hello</h1>
    <p>
      xxx <strong>yyy</strong>
    </p>
  </div>
)

const app = document.getElementById('app')

if (app) {
  Didact.render(e, app)
}
