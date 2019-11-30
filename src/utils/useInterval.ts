import { useRef, useEffect } from "react";

/**
 * A simple interval react hook
 *
 * @param callback is called at the specified frequency
 * @param delay in milliseconds, defines the frequency
 * @param dependencies which should invalidate the callback
 */
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
