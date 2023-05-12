// import './gpt/index';
import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Hello } from "./Hello";
import { ReactCompartmentC } from "./Container";

const App = () => {
  const [greeting, setGreeting] = useState('haay');
  const onInputReady = useCallback((el) => {
    // if (el) {
      console.log('onInputReady', el)
    // }
  }, [])
  return (
    <>
    <ReactCompartmentC>
      <input value={greeting} ref={onInputReady} onChange={({ target: { value } }) => {
        console.log('input.onChange', value)
        setGreeting(value)
      }}/>
    </ReactCompartmentC>
    <ReactCompartmentC>
      <Hello greeting={greeting}/>
    </ReactCompartmentC>
    </>
  )
}
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App/>
);
