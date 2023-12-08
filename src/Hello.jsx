import { useEffect, useMemo, useState } from "react";


export const Hello = ({ greeting = 'haay' }) => {
  const [counter, setCounter] = useState(0);

  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCounter(id => id + 1)
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);

  const message = useMemo(() => {
    return `${greeting} wuurl`;
  }, [greeting]);

  return (
    <h1>{message} {counter}</h1>
  )
};
