import React, { useState, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Hello } from "./Hello";
import { ChatHistory } from "./ChatHistory";
// import { useInterval } from "./useInterval";
import { ReactCompartmentOpaqueChildrenPortal, ReactCompartmentOpaqueChildrenRoot, ReactCompartmentPortal, ReactCompartmentRoot, withReactCompartmentPortal, withReactCompartmentRoot } from "./Container";
// const ReactCompartment = ({ children }) => {
//   return children;
// }

const PortalHello = withReactCompartmentPortal(Hello)
const RootHello = withReactCompartmentRoot(Hello)

const App = () => {
  const [greeting, setGreeting] = useState('haay');
  const [chatLog, setChatLog] = useState(['f1rst']);
  
  const renderId = Math.random().toString(36).substring(7)
  const randomId = useMemo(() => {
    return Math.random().toString(36).substring(7);
  }, [])
  // console.log(randomId, renderId, 'App render', { greeting, chatLog })

  // useEffect(() => {
    // console.log(randomId, renderId, 'chatLog', chatLog)
  // }, [chatLog])

  // useInterval(() => {
  //   console.log(randomId, renderId, 'setInterval', chatLog)
  //   const newLog = [...chatLog, 'ping']
  //   setChatLog(newLog)
  //   console.log(randomId, renderId, 'newLog', newLog)
  // }, 1000);

  const onInputReady = useCallback((el) => {
    if (el) {
      // console.log(randomId, renderId, 'virtual input ready', el)
    }
  }, [])

  const submit = () => {
    // console.log(randomId, renderId, 'submit', chatLog, greeting)
    const newLog = [...chatLog, greeting]
    setChatLog(newLog)
    // console.log(randomId, renderId, 'newLog', newLog)
    // TODO: this is observed to not work correctly
    // perhaps the wrong handler? or doesnt trigger re-render?
    setGreeting('')
  }

  const onChange = ({ target: { value } }) => {
    // console.log(randomId, renderId, 'input.onChange', value)
    setGreeting(value)
  }
  const onKeyDown = ({ key }) => {
    if (key === 'Enter') {
      // console.log(randomId, renderId, 'input.onKeyDown', key)
      submit()
    }
  }

  return (
    <>
      <ReactCompartmentPortal>
        <input
          ref={onInputReady}
          value={greeting}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
      </ReactCompartmentPortal>
      <ReactCompartmentPortal>
        <button onClick={submit}>submit</button>
      </ReactCompartmentPortal>
      
      <ReactCompartmentPortal>
        <Hello greeting={greeting}/>
      </ReactCompartmentPortal>
      <ReactCompartmentRoot>
        <Hello greeting={greeting}/>
      </ReactCompartmentRoot>

      <PortalHello greeting={greeting}/>
      <RootHello greeting={greeting}/>

      <ReactCompartmentOpaqueChildrenPortal>
        <Hello greeting={greeting}/>
      </ReactCompartmentOpaqueChildrenPortal>
      <ReactCompartmentOpaqueChildrenRoot>
        <Hello greeting={greeting}/>
      </ReactCompartmentOpaqueChildrenRoot>


      <ReactCompartmentPortal>
        <ChatHistory chatLog={chatLog}/>
      </ReactCompartmentPortal>

      <ReactCompartmentOpaqueChildrenPortal>
        <ChatHistory chatLog={chatLog}/>
      </ReactCompartmentOpaqueChildrenPortal>
      <ReactCompartmentOpaqueChildrenRoot>
        <ChatHistory chatLog={chatLog}/>
      </ReactCompartmentOpaqueChildrenRoot>
    </>
  )
}
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App/>
);
