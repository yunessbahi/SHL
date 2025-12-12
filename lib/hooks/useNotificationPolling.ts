import { useNotificationStore } from "@/lib/stores/notification-store";
import { useEffect } from "react";

export function useNotificationPolling() {
  const refresh = useNotificationStore((s) => s.refresh);
  const lastFetched = useNotificationStore((s) => s.lastFetched);

  useEffect(() => {
    // Only do initial fetch if we don't have recent data
    const lastFetchedTime =
      lastFetched instanceof Date
        ? lastFetched.getTime()
        : typeof lastFetched === "string"
          ? new Date(lastFetched).getTime()
          : 0;
    if (!lastFetched || Date.now() - lastFetchedTime > 30000) {
      refresh(); // initial fetch
    }

    const interval = setInterval(() => {
      refresh();
    }, 60_000); // every 60 seconds

    return () => clearInterval(interval);
  }, [refresh, lastFetched]);
}
