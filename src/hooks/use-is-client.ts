import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false أثناء الرندر على السيرفر وأول تحميل، ثم true في المتصفح. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
