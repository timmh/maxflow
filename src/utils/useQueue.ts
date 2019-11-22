import { useState } from "react";

function useQueue<T>(
  initialQueue?: T[],
  capacity?: number
): {
  queue: T[];
  enqueue: (obj: T) => void;
  reset: (objs: T[]) => void;
} {
  const [queue, setQueue] = useState<T[]>(initialQueue || []);

  return {
    queue,
    enqueue: obj => {
      setQueue([
        obj,
        ...queue.slice(0, (capacity ? capacity : queue.length) - 1)
      ]);
    },
    reset: objs => {
      setQueue(objs);
    }
  };
}

export default useQueue;
