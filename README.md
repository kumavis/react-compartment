status: experiment - not ready for production

### react-compartment

This is intended to achieve DOM sandboxing of react components.

#### problem
While defining a react component inside of a SES shim can prevent access to the DOM via globals, it doesnt prevent the component from later accessing the DOM when rendered.

This experiment attempts to solve that issue.

### usage

```js
  <ReactCompartment>
    <input
      ref={onInputReady}
      value={greeting}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  </ReactCompartment>
```

When wrapped in a `ReactCompartment`, children are rendered twice per render pass.

First, into a "real" inert container with no function attributes or handlers via `renderToString` which is transformed by `DOMPurify` and back into a react-tree via `html-react-parser`.

Second, the children are rendered again and hydrated into a "virtual" jsdom. Dom events are forwarded from the "real" container to the "virtual" container, ensuring they only contain simples values or elements mapped to the virtual counterparts.

