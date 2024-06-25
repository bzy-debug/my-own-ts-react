declare namespace JSX {
  interface IntrinsicElements {
    [index: string]: any
  }
}

const Didact = {
  createElement: () => {
    console.log(1)
  },
}

const e = <h1>Hello</h1>
