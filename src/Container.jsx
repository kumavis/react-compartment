
import { renderToString } from 'react-dom/server';
import { domToReact, htmlToDOM } from 'html-react-parser';
import * as DOMPurify from 'dompurify';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import { useCallback, createElement } from 'react';

// FYI: in some cases in its code (not witnessed) react may use the global document

// DOMPurify.addHook(
//   'beforeSanitizeElements',
//   function (currentNode, hookEvent, config) {
//     // Do something with the current node and return it
//     // You can also mutate hookEvent (i.e. set hookEvent.forceKeepAttr = true)
//     console.log('beforeSanitizeElements', currentNode);
//     return currentNode;
//   }
// );

export function ReactCompartment({ children } = {}) {
  const onSectionReady = useCallback((containerRoot) => {
    if (!containerRoot) return;
    // create virtual dom for containerized element
    // with event forwarding
    const { container } = createVirtualContainer({ containerRoot })
    // setup continuous rendering into vdom for this container
    const root = createRoot(container);
    root.render(children);
  }, [])

  // every pass we render to string, purify, and then render to vdom
  const html = renderToString(children);
  if (html === '') {
    return [];
  }
  const safeHtml = DOMPurify.sanitize(html)
  console.log('safeHtml', safeHtml)
  const domTree = htmlToDOM(safeHtml, {
    lowerCaseAttributeNames: false
  })
  const reactTree = domToReact(domTree, {})

  return createElement('section', {
    ref: onSectionReady,
  }, reactTree)
}

function createVirtualContainer ({ containerRoot }) {

  const fakeDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://fake.website/',
  });

  const { document: compartmentDocument } = fakeDom.window;
  const container = compartmentDocument.createElement('div');
  container.id = 'root';
  compartmentDocument.body.appendChild(container);

  const virtualToRealMap = new WeakMap();
  const realToVirtualMap = new WeakMap();
  realToVirtualMap.set(containerRoot, container);
  virtualToRealMap.set(container, containerRoot);

  // this will populate the map for all encountered elements
  const mapAcross = (targetNode, ceilingNode, thisToThatMap, thatToThisMap) => {
    let knownAncestorCandidate = targetNode
    const path = []
    const pathKeys = []
    // 1. establish known ancestor and path from ancestor to target
    while (knownAncestorCandidate !== ceilingNode) {
      if (thisToThatMap.has(knownAncestorCandidate)) {
        break;
      }
      const parent = knownAncestorCandidate.parentNode;
      // element must not be in the dom yet (?)
      if (!parent) {
        return
      }
      path.push(knownAncestorCandidate)
      pathKeys.push(Array.prototype.indexOf.call(parent.childNodes, knownAncestorCandidate))
      knownAncestorCandidate = parent;
    }
    // 2. walk from mapped ancestor down path
    const knownAncestorThat = thisToThatMap.get(knownAncestorCandidate);
    let currentThat = knownAncestorThat;
    while (path.length) {
      const childThis = path.pop();
      const childKey = pathKeys.pop();
      const childThat = currentThat.childNodes[childKey];
      thisToThatMap.set(childThis, childThat);
      thatToThisMap.set(childThat, childThis);
      currentThat = childThat;
    }
    return currentThat;
  }
  const mapRealToVirtual = (realElement) => {
    if (realElement === containerRoot) return container;
    if (realElement === document) return compartmentDocument;
    if (realToVirtualMap.has(realElement)) return realToVirtualMap.get(realElement);
    const result = mapAcross(realElement, containerRoot, realToVirtualMap, virtualToRealMap);
    if (!result) console.log('failed to map real to virtual', realElement)
    return result;
  }
  const mapVirtualToReal = (virtualElement) => {
    if (virtualElement === container) return containerRoot;
    if (virtualElement === compartmentDocument) return document;
    if (virtualToRealMap.has(virtualElement)) return virtualToRealMap.get(virtualElement);
    const result = mapAcross(virtualElement, container, virtualToRealMap, realToVirtualMap);
    if (!result) console.log('failed to map virtual to real', virtualElement)
    return result;
  }

  const EventTargetPrototype = fakeDom.window.EventTarget.prototype;

  EventTargetPrototype.addEventListener = function (eventName, listener, useCapture) {
    const virtualElement = this;

    const realElement = mapVirtualToReal(virtualElement)
    if (!realElement) {
      console.warn('TODO: addEventListener failed to map virtualElement', virtualElement)
      return
    }

    const wrappedListener = (event) => {
      const target = mapRealToVirtual(event.target)
      const mappedEvent = {
        ...event,
        target,
        srcElement: target,
      }
      // special case: handle input/change events
      if (eventName === 'input' || eventName === 'change') {
        // need to update the input so "input" event gets upgraded to "onChange"
        // need to disable the tracker so it doesnt record the change
        const virtualInput = target
        if (virtualInput._valueTracker) {
          virtualInput._valueTracker.stopTracking();
        }
        virtualInput.value = event.target.value;
      }
      listener(mappedEvent)
    }
    realElement.addEventListener(eventName, wrappedListener, useCapture)
    return
  }
  EventTargetPrototype.removeEventListener = function () {
    if (this === container) {
      console.log('add/remove event on root', arguments[0])
      return
    }
    console.log('removeEventListener local', this, arguments)
    throw new Error('unsupported')
  }

  return {
    container,
  }
}