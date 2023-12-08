
import { renderToString } from 'react-dom/server';
import { domToReact, htmlToDOM } from 'html-react-parser';
import * as DOMPurify from 'dompurify';
import { createPortal } from 'react-dom';
import { JSDOM } from 'jsdom';
import React, { useCallback, useState, createElement, memo } from 'react';

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

// this is the more correct model over a component will children because
// parent compartments arent re-rendered when their children are
export function withReactCompartment(Component, alternatePropsAreEqualFn) {
  return function ReactCompartmentWrapper(props) {
    const [virtualEnvironment, setVirtualEnvironment] = useState(null)
    const [reactTree, setReactTree] = useState(null)

    // after the section is mounted, we can create a virtual container
    const onSectionReady = useCallback((containerRoot) => {
      if (!containerRoot) return;
      const { container } = createVirtualContainer({
        containerRoot,
        onMutation: () => {
          const html = container.outerHTML;
          const safeHtml = DOMPurify.sanitize(html)
          const domTree = htmlToDOM(safeHtml, {
            lowerCaseAttributeNames: false
          })
          const reactTree = domToReact(domTree, { library: React })
          setReactTree(reactTree)
        }
      })
      // We use memo to prevent the component from re-rendering
      // when the update is triggered.
      const MemoizedComponent = memo(Component, alternatePropsAreEqualFn)
      setVirtualEnvironment({
        container,
        Component: MemoizedComponent,
      });
    }, [])

    return (
      createElement('section', {
        ref: onSectionReady,
      }, [
        // render the virtual container in jsdom
        virtualEnvironment && createPortal(
          createElement(virtualEnvironment.Component, props),
          virtualEnvironment.container,
          'virtual-container'
        ),
        // render the sandboxed html
        reactTree,
      ])
    )
  }
}

export function ReactCompartment({ children } = {}) {
  const [virtualContainer, setVirtualContainer] = useState(null)
  
  // after the section is mounted, we can create a virtual container
  const onSectionReady = useCallback((containerRoot) => {
    if (!containerRoot) return;
    const { container } = createVirtualContainer({ containerRoot })
    setVirtualContainer(container);
  }, [])

  // every pass we render to string, purify, and then render to vdom
  const html = renderToString(children);
  const safeHtml = DOMPurify.sanitize(html)
  const domTree = htmlToDOM(safeHtml, {
    lowerCaseAttributeNames: false
  })
  const reactTree = domToReact(domTree, { library: React })

  return (
    createElement('section', {
      ref: onSectionReady,
    }, [
      // render the virtual container in jsdom
      virtualContainer && createPortal(children, virtualContainer, 'virtual-container'),
      // render the sandboxed html
      reactTree,
    ])
  )
}

// creates a copy of a real event with mapped virtual elements
const mapEventToVirtual = (event, mapRealToVirtual) => {
  const target = mapRealToVirtual(event.target)
  const mappedEvent = {
    target,
    srcElement: target,
  }
  for (let key in event) {
    if (key === 'target' || key === 'srcElement') continue;
    const value = event[key];
    const type = typeof value;
    // handle basic types
    if (type === 'string' || type === 'number') {
      mappedEvent[key] = value;
      continue;
    }
    // dont pass most non-basic types
    if (type === 'function') continue;
    if (type === 'symbol') continue;
    if (type === 'object') continue;
    // map elements
    if (value instanceof Element) {
      mappedEvent[key] = mapRealToVirtual(value);
      continue;
    };
  }
  return mappedEvent;
}

// creates a virtual dom for a containerized component
// with event forwarding
function createVirtualContainer ({ containerRoot, onMutation = ()=>{} }) {
  // TODO: consider "JSDOM.fragment"
  const fakeDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://containerized-component.fake.website/',
  });

  const { document: compartmentDocument } = fakeDom.window;
  const container = compartmentDocument.createElement('div');
  container.id = 'root';
  compartmentDocument.body.appendChild(container);

  const mutationObserver = new fakeDom.window.MutationObserver((mutations, observer) => {
    onMutation();
  });
  mutationObserver.observe(container, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
    attributeOldValue: true,
    characterDataOldValue: true
  });

  const virtualToRealMap = new WeakMap();
  const realToVirtualMap = new WeakMap();
  realToVirtualMap.set(containerRoot, container);
  virtualToRealMap.set(container, containerRoot);

  // generic protocol for mapping across the real/virtual boundary
  // may not be sane! idk!
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
      // corresponding child is missing
      if (!childThat) {
        return
      }
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

    const wrappedListener = (realEvent) => {
      const mappedEvent = mapEventToVirtual(realEvent, mapRealToVirtual)
      // special case: handle input/change events
      if (eventName === 'input' || eventName === 'change') {
        // need to update the input so "input" event gets upgraded to "onChange"
        // need to disable the tracker so it doesnt record the change
        const virtualInput = mappedEvent.target
        if (virtualInput._valueTracker) {
          virtualInput._valueTracker.stopTracking();
        }
        virtualInput.value = realEvent.target.value;
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