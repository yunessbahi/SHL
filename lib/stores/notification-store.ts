import { Notification, notificationAPI } from "@/lib/api/notifications";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationStore {
  unreadCount: number;
  notifications: Notification[];
  unreadByCategory: Record<string, number>;
  lastFetched: Date | null;
  loading: boolean;
  setUnreadCount: (count: number) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadByCategory: (counts: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      unreadCount: 0,
      notifications: [],
      unreadByCategory: {},
      lastFetched: null,
      loading: false,

      setUnreadCount: (count: number) => set({ unreadCount: count }),
      setNotifications: (notifications: Notification[]) =>
        set({ notifications }),
      setUnreadByCategory: (counts: Record<string, number>) =>
        set({ unreadByCategory: counts }),
      setLoading: (loading: boolean) => set({ loading }),

      refresh: async () => {
        const { lastFetched } = get();

        // If we have recent data (less than 30 seconds old), skip the fetch
        const lastFetchedTime =
          lastFetched instanceof Date
            ? lastFetched.getTime()
            : typeof lastFetched === "string"
              ? new Date(lastFetched).getTime()
              : 0;
        if (lastFetched && Date.now() - lastFetchedTime < 30000) {
          return;
        }

        try {
          set({ loading: true });

          // Run notification engine first
          try {
            await notificationAPI.runNotificationEngine();
          } catch (engineError) {
            console.error("Failed to run notification engine:", engineError);
          }

          // Fetch notifications and unread data
          const [notificationsResponse, unreadResponse] = await Promise.all([
            notificationAPI.getNotifications({ limit: 100 }),
            notificationAPI.getUnreadNotifications(),
          ]);

          set({
            notifications: notificationsResponse.notifications,
            unreadCount: unreadResponse.total_unread,
            unreadByCategory: unreadResponse.by_category || {},
            lastFetched: new Date(),
            loading: false,
          });
        } catch (error) {
          console.error("Failed to refresh notifications:", error);
          set({ loading: false });
        }
      },

      markAsRead: async (id: number) => {
        try {
          await notificationAPI.markNotificationRead(id);

          const { notifications, unreadCount, unreadByCategory } = get();
          const updatedNotifications = notifications.map((n) =>
            n.id === id ? { ...n, is_read: true } : n,
          );

          // Find the notification to update category count
          const notification = notifications.find((n) => n.id === id);
          let updatedUnreadByCategory = { ...unreadByCategory };
          if (notification && !notification.is_read) {
            updatedUnreadByCategory[notification.category] = Math.max(
              0,
              (unreadByCategory[notification.category] || 0) - 1,
            );
          }

          set({
            notifications: updatedNotifications,
            unreadCount: Math.max(0, unreadCount - 1),
            unreadByCategory: updatedUnreadByCategory,
          });
        } catch (error) {
          console.error("Failed to mark notification as read:", error);
        }
      },

      markAllAsRead: async () => {
        try {
          await notificationAPI.markAllNotificationsRead();

          const { notifications } = get();
          const updatedNotifications = notifications.map((n) => ({
            ...n,
            is_read: true,
          }));

          set({
            notifications: updatedNotifications,
            unreadCount: 0,
            unreadByCategory: {},
          });
        } catch (error) {
          console.error("Failed to mark all notifications as read:", error);
        }
      },
    }),
    {
      name: "notification-store",
      // Only persist unreadCount, not the full notifications list
      partialize: (state) => ({
        unreadCount: state.unreadCount,
        lastFetched: state.lastFetched,
      }),
    },
  ),
);
