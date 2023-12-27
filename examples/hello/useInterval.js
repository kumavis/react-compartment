import { useEffect, useRef } from "react";

export const useInterval = (callback, delay) => {
  const intervalRef = useRef()
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback]);

  useEffect(() => {
    console.log('interval tee')
    intervalRef.current = window.setInterval(() => {
      callbackRef.current()
    }, delay)
    return () => {
      console.log('interval clear')
      window.clearInterval(intervalRef.current)
    }
  }, [delay]);

  return intervalRef;
}