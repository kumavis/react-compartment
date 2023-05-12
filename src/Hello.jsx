import { useMemo, useCallback } from "react";


export const Hello = ({ greeting = 'haay' }) => {

  const message = useMemo(() => {
    console.log('greeter memo', greeting)
    return `${greeting} wuurl`;
  }, [greeting]);

  const refReady = useCallback((el) => {
    if (el) {
      console.log('ref ready', el)
    }
  })

  return (
    <h1 ref={refReady}>{message}</h1>
  )
};
