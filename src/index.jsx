import React, { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { Hello } from "./Hello";
import { ReactCompartment } from "./Container";

const App = () => {
  const [greeting, setGreeting] = useState('haay');
  const onInputReady = useCallback((el) => {
    if (el) {
      console.log('virtual input ready', el)
    }
  }, [])
  return (
    <>
    <ReactCompartment>
      <input value={greeting} ref={onInputReady} onChange={({ target: { value } }) => {
        console.log('input.onChange', value)
        setGreeting(value)
      }}/>
    </ReactCompartment>
    <ReactCompartment>
      <Hello greeting={greeting}/>
    </ReactCompartment>
    </>
  )
}
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <App/>
);
