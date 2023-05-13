import { useMemo } from "react";


export const Hello = ({ greeting = 'haay' }) => {

  const message = useMemo(() => {
    return `${greeting} wuurl`;
  }, [greeting]);

  return (
    <h1>{message}</h1>
  )
};
