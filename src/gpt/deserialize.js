import { eventMappings } from './customRenderer.js';

export function createRealNode(serializedNode) {
  let node;
  
  if (serializedNode.type === Node.ELEMENT_NODE) {
    node = document.createElement(serializedNode.tagName);
    
    for (const [name, value] of Object.entries(serializedNode.attributes)) {
      node.setAttribute(name, value);
    }
    
    // Attach event listeners
    const handlers = eventMappings.get(serializedNode);
    
    if (handlers) {
      for (const [eventName, handler] of Object.entries(handlers)) {
        node.addEventListener(eventName, (event) => {
          // Invoke the event handler from the sandboxed component
          handler(event);
        });
      }
    }
  } else if (serializedNode.type === Node.TEXT_NODE) {
    node = document.createTextNode(serializedNode.textContent);
  } else {
    // Handle other node types as needed
    return null;
  }
  
  for (const child of serializedNode.children) {
    const realChild = createRealNode(child);
    
    if (realChild) {
      node.appendChild(realChild);
    }
  }
  
  return node;
}

export function deserialize(serializedNode, realContainer) {
  const realNode = createRealNode(serializedNode);
  realContainer.appendChild(realNode);
}


// This will ensure that the event listeners are properly attached to the real DOM elements while keeping the sandboxed components isolated from the real DOM. The event delegation pattern allows you to manage events without directly attaching them to the sandboxed components.

// Now, when you deserialize the serialized tree into the real container, the event system will be connected between the real rendered DOM and the sandboxed components. Your sandboxed components will remain isolated from the real DOM, but the events will be properly propagated and handled.
