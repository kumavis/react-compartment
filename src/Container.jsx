
import { renderToString } from 'react-dom/server';
import { domToReact, htmlToDOM } from 'html-react-parser';
import * as DOMPurify from 'dompurify';
import ReactDOM, { hydrate } from 'react-dom';
import { JSDOM } from 'jsdom';
import { useCallback, useRef, useState, useEffect, createElement } from 'react';
import { serialize } from './gpt/serialize';

// const html = renderToString(<Hello />);
// console.log(html); // For example, "<svg>...</svg>"

// DOMPurify.addHook(
//   'beforeSanitizeElements',
//   function (currentNode, hookEvent, config) {
//     // Do something with the current node and return it
//     // You can also mutate hookEvent (i.e. set hookEvent.forceKeepAttr = true)
//     console.log('beforeSanitizeElements', currentNode);
//     return currentNode;
//   }
// );

const Xyz = () => {
  const setRef = ()=>{}
  return (
    <div ref={setRef}/>
  )
}


export function ReactCompartmentA({ children, ...opts } = {}) {
  // const html = renderToString(<Hello />);
  const html = renderToString(children);
  // console.log(html); // For example, "<svg>...</svg>"
  const reactNode = parse(DOMPurify.sanitize(html), {
    ...{
      // replace: replaceNode,
    },
    ...opts,
  })
  // hydrate(reactNode, domNode);
  return reactNode;
}

const domParserOptions = { lowerCaseAttributeNames: false };
const parse = (html, options = {}) => {
  if (typeof html !== 'string') {
    throw new TypeError('First argument must be a string');
  }
  if (html === '') {
    return [];
  }
  const domTree = htmlToDOM(html, options.htmlparser2 || domParserOptions)
  // console.log('domTree', domTree)
  if (options.refForNode) {
    for (const [index, node] of Object.entries(domTree)) {
      node.attribs.ref = options.refForNode(node, index)
    }
  }
  return domToReact(
    domTree,
    options
  )
}

// hydration is not working
// there doesnt seem to be a correct
// container to hydrate into.
// want to hydrate into a sandboxed element anyways
// and hydrate is deprecated
export function ReactCompartmentB({ children, ...opts } = {}) {
  // const componentRef = useRef(null);
  // const onComponentReady = useCallback((domNode) => {
  //   console.log('onComponentReady', domNode)
  //   hydrate(reactNode, domNode);
  // }, [])
  const makeHydrator = (reactNode) => {
    return (domNode) => {
      // const hydrationTarget = domNode.parentNode;
      console.log('hydrating', domNode, 'as', reactNode)
      hydrate(reactNode, domNode);
    }
  }
  // const html = renderToString(<Hello />);
  const htmlString = renderToString(children);
  console.log(htmlString); // For example, "<svg>...</svg>"
  const reactNodes = parse(DOMPurify.sanitize(htmlString), {
    ...{
      // replace: replaceNode,
      refForNode: (safeReactNode, index) => {
        const originalNode = Array.isArray(children) ? children[index] : children;
        console.log('refForNode', index, safeReactNode, originalNode, children)
        return makeHydrator(originalNode)
      }
    },
    ...opts,
  })
  // reactNode.ref = onComponentReady;
  // hydrate(reactNode, domNode);
  console.log('reactNodes', reactNodes)
  // console.log('reactNode', Xyz())
  return reactNodes;
}


export function ReactCompartmentC({ children, ...opts } = {}) {
  // const sectionRef = useRef(null)
  const [reactTree, setReactTree] = useState(null)

  // const [rootEvents, setRootEvents] = useState([])
  // const [documentEvents, setDocumentEvents] = useState([])
  // const [elementEvents, setElementEvents] = useState([])

  const onSectionReady = useCallback((containerRoot) => {
    if (!containerRoot) return;
    if (reactTree) return;

    console.log('containerRoot ready', containerRoot)

    const fakeDom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://fake.website/',
    });

    const { document: compartmentDocument } = fakeDom.window;
    const container = compartmentDocument.createElement('div');
    container.id = 'root';
    compartmentDocument.body.appendChild(container);

    const domToContainerMap = new WeakMap();
    domToContainerMap.set(containerRoot, container);

    const mapDomElement = (targetDomNode) => {
      let knownAncestorCandidate = targetDomNode
      const path = []
      const pathKeys = []
      // 1. establish known ancestor and path from ancestor to target
      while (knownAncestorCandidate !== containerRoot) {
        if (domToContainerMap.has(knownAncestorCandidate)) {
          break;
        }
        const parent = knownAncestorCandidate.parentNode;
        path.push(knownAncestorCandidate)
        pathKeys.push(Array.prototype.indexOf.call(parent.childNodes, knownAncestorCandidate))
        knownAncestorCandidate = parent;
      }
      // 2. walk from mapped ancestor down path
      const knownAncestor = domToContainerMap.get(knownAncestorCandidate);
      let current = knownAncestor;
      while (path.length) {
        const child = path.pop();
        const childKey = pathKeys.pop();
        const newChild = current.childNodes[childKey];
        domToContainerMap.set(child, newChild);
        current = newChild;
      }
      return current;
    }

    const mapElementContainerToDom = (element) => {
      if (element === container) return containerRoot;
      if (element === compartmentDocument) return document;
      // console.warn('mapElementContainerToDom failed', element)
    }
    const mapElementDomToContainer = (element) => {
      if (element === containerRoot) return container;
      if (element === document) return compartmentDocument;
      if (domToContainerMap.has(element)) return domToContainerMap.get(element);
      const result = mapDomElement(element);
      console.warn('mapElementDomToContainer element', element, result)
      return result;
    }

    const EventTargetPrototype = fakeDom.window.EventTarget.prototype;
    // const addEventListener = EventTargetPrototype.addEventListener;
    // const removeEventListener = EventTargetPrototype.removeEventListener;

    EventTargetPrototype.addEventListener = function (eventName, listener, useCapture) {
      const element = this;
      if (element === container) {
        // console.log('addEventListener on root', arguments[0])
        // setRootEvents([...rootEvents, { eventName, element, listener, useCapture }])

        const wrappedListener = (event) => {
          // console.log('root event', event)
          const mappedEvent = {
            ...event,
            target: mapElementDomToContainer(event.target),
            srcElement: mapElementDomToContainer(event.srcElement),
          }
          // if (eventName === 'change') {
          //   console.log('mappedEvent: change', event, mappedEvent)
          // }
          if (eventName === 'input') {
            // need to update the input so "input" event gets upgraded to "onChange"
            // need to disable the tracker so it doesnt record the change
            const virtualInput = mapElementDomToContainer(event.target)
            if (virtualInput._valueTracker) {
              virtualInput._valueTracker.stopTracking();
            }
            virtualInput.value = event.target.value;
          }
          listener(mappedEvent)
        }
        containerRoot.addEventListener(eventName, wrappedListener, useCapture)
        return
      }
      if (element === compartmentDocument) {
        console.log('addEventListener on document', arguments[0])
        // setDocumentEvents([...documentEvents, { eventName, element, listener, useCapture }])
        return
      }
      console.log('addEventListener on element', this, arguments)
      // setElementEvents([...elementEvents, { eventName, element, listener, useCapture }])
      // addEventListener.apply(this, arguments);
    }
    EventTargetPrototype.removeEventListener = function () {
      if (this === container) {
        console.log('add/remove event on root', arguments[0])
        return
      }
      console.log('removeEventListener local', this, arguments)
      throw new Error('unsupported')
    }

    // TODO: need to lie about globalThis.document?
    ReactDOM.render(children, container, () => {
      console.log('rendered')
      const domData = serialize(container);
      console.log('domData after', domData)
    });

    const domData = serialize(container);
    console.log('domData before', domData)

    const html = renderToString(children);
    if (typeof html !== 'string') {
      throw new TypeError('First argument must be a string');
    }
    if (html === '') {
      return [];
    }
    const safeHtml = DOMPurify.sanitize(html)
    console.log('safeHtml', safeHtml)
    const domTree = htmlToDOM(safeHtml, domParserOptions)
    const reactTree = domToReact(domTree, {})
    setReactTree(reactTree)
  }, [])

  // const refReady = useCallback((containerRoot) => {
  //   sectionRef.current = containerRoot;
  //   console.log('container ref ready', containerRoot, {rootEvents, documentEvents, elementEvents})
  //   for (const eventListenerData of rootEvents) {
  //     containerRoot.addEventListener(eventListenerData.eventName, eventListenerData.listener, eventListenerData.useCapture)
  //   }
  // }, [])
  // console.log('domTree', domTree)
  // if (options.refForNode) {
  //   for (const [index, node] of Object.entries(domTree)) {
  //     node.attribs.ref = options.refForNode(node, index)
  //   }
  // }

  // const html = renderToString(children);
  // console.log(html); // For example, "<svg>...</svg>"
  // const reactNode = parse(DOMPurify.sanitize(html), {
  //   ...{
  //     // replace: replaceNode,
  //   },
  //   ...opts,
  // })
  return createElement('section', {
    ref: onSectionReady,
  }, reactTree)
  // hydrate(reactNode, domNode);
  // return reactNode;
}