/**
 * Workspace Store - Global state management using Zustand
 */

import { create } from "zustand";
import {
  Activity,
  LinkCreationStats,
  QuickAction,
  TimeRange,
  UserStats,
} from "../types/workspaceTypes";

interface WorkspaceState {
  // Activity State
  activities: Activity[];
  notifications: Activity[];
  activityLoading: boolean;
  activityError: string | null;

  // Quick Access State
  quickActions: QuickAction[];
  customActions: QuickAction[];
  quickAccessLoading: boolean;
  quickAccessError: string | null;

  // Stats State
  userStats: UserStats | null;
  linkCreationStats: LinkCreationStats | null;
  statsLoading: boolean;
  statsError: string | null;

  // UI State
  selectedTimeRange: TimeRange;
  activityFilter: string;

  // Actions
  setActivities: (activities: Activity[]) => void;
  setNotifications: (notifications: Activity[]) => void;
  setActivityLoading: (loading: boolean) => void;
  setActivityError: (error: string | null) => void;

  setQuickActions: (actions: QuickAction[]) => void;
  addCustomAction: (action: QuickAction) => void;
  setQuickAccessLoading: (loading: boolean) => void;
  setQuickAccessError: (error: string | null) => void;

  setUserStats: (stats: UserStats) => void;
  setLinkCreationStats: (stats: LinkCreationStats) => void;
  setStatsLoading: (loading: boolean) => void;
  setStatsError: (error: string | null) => void;

  setSelectedTimeRange: (timeRange: TimeRange) => void;
  setActivityFilter: (filter: string) => void;

  // Derived data
  getFilteredActivities: () => Activity[];
  getUnreadNotificationCount: () => number;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  // Initial State
  activities: [],
  notifications: [],
  activityLoading: false,
  activityError: null,

  quickActions: [],
  customActions: [],
  quickAccessLoading: false,
  quickAccessError: null,

  userStats: null,
  linkCreationStats: null,
  statsLoading: false,
  statsError: null,

  selectedTimeRange: "week",
  activityFilter: "all",

  // Activity Actions
  setActivities: (activities) => set({ activities }),
  setNotifications: (notifications) => set({ notifications }),
  setActivityLoading: (loading) => set({ activityLoading: loading }),
  setActivityError: (error) => set({ activityError: error }),

  // Quick Access Actions
  setQuickActions: (actions) => set({ quickActions: actions }),
  addCustomAction: (action) =>
    set((state) => ({
      customActions: [...state.customActions, action],
    })),
  setQuickAccessLoading: (loading) => set({ quickAccessLoading: loading }),
  setQuickAccessError: (error) => set({ quickAccessError: error }),

  // Stats Actions
  setUserStats: (stats) => set({ userStats: stats }),
  setLinkCreationStats: (stats) => set({ linkCreationStats: stats }),
  setStatsLoading: (loading) => set({ statsLoading: loading }),
  setStatsError: (error) => set({ statsError: error }),

  // UI Actions
  setSelectedTimeRange: (timeRange) => set({ selectedTimeRange: timeRange }),
  setActivityFilter: (filter) => set({ activityFilter: filter }),

  // Derived Data
  getFilteredActivities: () => {
    const { activities, activityFilter, selectedTimeRange } = get();
    if (activityFilter === "all") return activities;

    return activities
      .filter((activity) => {
        if (activityFilter === "links") return activity.type.includes("link");
        if (activityFilter === "notifications")
          return activity.type === "notification";
        if (activityFilter === "campaigns")
          return activity.type === "campaign_started";
        return true;
      })
      .filter((activity) => {
        // Apply time range filtering
        const activityDate = new Date(activity.timestamp);
        const now = new Date();

        // Calculate time range start based on selectedTimeRange
        let timeRangeStart: Date;
        switch (selectedTimeRange) {
          case "day":
            timeRangeStart = new Date(now.getTime() - 86400000); // 24 hours
            break;
          case "week":
            timeRangeStart = new Date(now.getTime() - 604800000); // 7 days
            break;
          case "month":
            timeRangeStart = new Date(now.getTime() - 2592000000); // 30 days
            break;
          case "year":
            timeRangeStart = new Date(now.getTime() - 31536000000); // 365 days
            break;
          default:
            timeRangeStart = new Date(now.getTime() - 604800000); // default to week
        }

        return activityDate >= timeRangeStart;
      });
  },

  getUnreadNotificationCount: () => {
    const { notifications } = get();
    return notifications.filter((n) => !n.readStatus).length;
  },
}));

// Hook for easy access to workspace store
export const useWorkspace = () => useWorkspaceStore();
