import ReactReconciler from 'react-reconciler';
import ReactDOM from 'react-dom';
import { JSDOM } from 'jsdom';

// Use the custom virtual DOM implementation
export const fakeDom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://fake.website/',
});

// global.window = dom.window;
// global.document = dom.window.document;
// global.navigator = dom.window.navigator;

export const eventMappings = new Map();

// const customRenderer = ReactReconciler({
//   supportsMutation: true,
//   // ...other configuration options
//   // Implement the required methods for the renderer
//   // For example: createInstance, appendChild, etc.
//   prepareUpdate(instance, type, oldProps, newProps) {
//     for (const propName in oldProps) {
//       if (propName.startsWith('on') && oldProps[propName] !== newProps[propName]) {
//         const eventName = propName.substring(2).toLowerCase();
//         eventMappings.set(instance, {
//           ...eventMappings.get(instance),
//           [eventName]: newProps[propName],
//         });
//       }
//     }
//   },
// });

// Expose render method
export const render = (component) => {
  // const containerNode = customRenderer.createContainer(container);
  // customRenderer.updateContainer(element, containerNode, null, null);
  const fakeDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://fake.website/',
  });
  const { document } = fakeDom.window;
  const container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);

  // TODO: need to lie about globalThis.document?
  ReactDOM.render(component, container);

  return container.childNodes[0];
};

// ContainerDom -> ContainerComponent -> renderToText -> textToReactDom -> hydrate ?
// advantage: ContainerComponent gets a ContainerDom



// hydration in react-reconciler
// https://github.com/facebook/react/blob/7cd98ef2bcbc10f164f778bade86a4daeb821011/packages/react-reconciler/src/forks/ReactFiberConfig.custom.js#L134-L195

// seems most relevant, but scary that we could be missing something
// hydrateInstance