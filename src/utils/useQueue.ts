import { useState } from "react";

/**
 * A simple react queue hook
 *
 * @param initialQueue the initial queue contents (if any)
 * @param capacity an optional capacity. elements added after
 *     the queue is full will push old elements out
 */
function useQueue<T>(
  initialQueue?: T[],
  capacity?: number
): {
  queue: T[]; // the queue's contents
  enqueue: (obj: T) => void; // enqueues an object
  reset: (objs: T[]) => void; // replaces the queue's contents
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
