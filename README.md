status: experiment - not ready for production

# react-compartment

This is intended to achieve DOM sandboxing of react components.

While defining a react component inside of a SES Compartment can prevent access to the DOM via global references, it doesnt prevent the component from later accessing the DOM via refs or events that point to the rendered elements. Since DOM nodes allow traversal of the entire DOM, this defeats the sandboxing normally provided by SES Compartments.

This experiment attempts to solve that issue.

### Security Goals:

#### Compartmentalization

Confined components should not be able to access outside their rendered DOM.

Usage looks like this:
```js
import { withReactCompartmentRoot } from 'react-compartment';

const UntrustedComponent = Compartment.evaluate(untrustedComponentSource);
const ConfinedComponent = withReactCompartmentRoot(UntrustedComponent);
```

First a "confined component" is created from an "untrusted component".
The confined component initially renders just a container div and initializes rendering of the untrusted component into a jsdom.
The jsdom is monitored by a `MutationObserver`.
When the confined component is rendered to the jsdom, a mutation is observed.
The jsdom is then serialized to an HTML string and processed through `dompurify`.
The sanitized HTML string is then turned back into a react tree, and rendered in the real DOM.
This would normally trigger a re-render of the confined component, so it is wrapped in a memoization with `memo`.

#### Transclusion

Confined components that accept external children should not be able to inspect children.
```jsx
<ConfinedComponent>
  <Child/>
  <Child/>
</ConfinedComponent>
```
In order to achieve this, external children are replaced with an opaque element tag (`<x-opaque-${id}>`) before calling the confined component. This allows the confined component to position and wrap the children, without inspecting them.
When converting from sanitized HTML string back to react nodes, the opaque elements are replaced with their original react nodes.

### Event Mapping

Confined elements still need to receive events such as user interaction (eg click events) from the real DOM. These events are caught on the actual DOM and the event properties and referenced elements are mapped to their jsdom equivalent or dropped.
The mapped event is then triggered in the jsdom.
