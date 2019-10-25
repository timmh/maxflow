import { useRef, useEffect } from "react";

function useInterval(
  callback: () => void,
  delay: number,
  dependencies?: any[]
) {
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback, dependencies]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback && savedCallback.current && savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;
