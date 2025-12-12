/**
 * Custom hook for workspace data fetching and state management
 */

import { useEffect, useState } from "react";
import ActivityService from "../services/activityService";
import QuickAccessService from "../services/quickAccessService";
import StatsService from "../services/statsService";
import { useWorkspaceStore } from "../stores/workspaceStore";
import { QuickAction, TimeRange } from "../types/workspaceTypes";

const activityService = new ActivityService();
const quickAccessService = new QuickAccessService();
const statsService = new StatsService();

export const useWorkspaceData = () => {
  const {
    // State from store
    activities,
    notifications,
    quickActions,
    customActions,
    userStats,
    linkCreationStats,
    activityLoading,
    quickAccessLoading,
    statsLoading,
    activityError,
    quickAccessError,
    statsError,
    selectedTimeRange,
    activityFilter,

    // Actions from store
    setActivities,
    setNotifications,
    setQuickActions,
    addCustomAction,
    setUserStats,
    setLinkCreationStats,
    setActivityLoading,
    setQuickAccessLoading,
    setStatsLoading,
    setActivityError,
    setQuickAccessError,
    setStatsError,
    setSelectedTimeRange,
    setActivityFilter,

    // Derived data
    getFilteredActivities,
    getUnreadNotificationCount,
  } = useWorkspaceStore();

  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  /**
   * Fetch all initial data
   */
  const fetchInitialData = async () => {
    try {
      setActivityLoading(true);
      setQuickAccessLoading(true);
      setStatsLoading(true);
      setActivityError(null);
      setQuickAccessError(null);
      setStatsError(null);

      // Fetch data in parallel
      const [
        activitiesData,
        notificationsData,
        quickActionsData,
        userStatsData,
        linkStatsData,
      ] = await Promise.all([
        activityService.fetchRecentActivities({ timeRange: selectedTimeRange }),
        activityService.fetchNotifications(),
        quickAccessService.fetchQuickActions(),
        statsService.fetchUserStats(selectedTimeRange),
        statsService.fetchLinkCreationStats(selectedTimeRange),
      ]);

      // Update store with fetched data
      setActivities(activitiesData);
      setNotifications(notificationsData);
      setQuickActions(quickActionsData);
      setUserStats(userStatsData);
      setLinkCreationStats(linkStatsData);

      setInitialLoadComplete(true);
    } catch (error) {
      console.error("Error fetching initial workspace data:", error);
      setActivityError("Failed to load activity data");
      setQuickAccessError("Failed to load quick access data");
      setStatsError("Failed to load statistics data");
    } finally {
      setActivityLoading(false);
      setQuickAccessLoading(false);
      setStatsLoading(false);
    }
  };

  /**
   * Refresh activity data
   */
  const refreshActivities = async () => {
    try {
      setActivityLoading(true);
      setActivityError(null);

      const [activitiesData, notificationsData] = await Promise.all([
        activityService.fetchRecentActivities({ timeRange: selectedTimeRange }),
        activityService.fetchNotifications(),
      ]);

      setActivities(activitiesData);
      setNotifications(notificationsData);
    } catch (error) {
      console.error("Error refreshing activities:", error);
      setActivityError("Failed to refresh activities");
    } finally {
      setActivityLoading(false);
    }
  };

  /**
   * Refresh stats data
   */
  const refreshStats = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);

      const [userStatsData, linkStatsData] = await Promise.all([
        statsService.fetchUserStats(selectedTimeRange),
        statsService.fetchLinkCreationStats(selectedTimeRange),
      ]);

      setUserStats(userStatsData);
      setLinkCreationStats(linkStatsData);
    } catch (error) {
      console.error("Error refreshing stats:", error);
      setStatsError("Failed to refresh statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  /**
   * Mark notifications as read
   */
  const markNotificationsAsRead = async (notificationIds: string[]) => {
    try {
      await activityService.markNotificationsAsRead(notificationIds);

      // Update local state optimistically
      setNotifications(
        notifications.map((notif) =>
          notificationIds.includes(notif.id)
            ? { ...notif, readStatus: true }
            : notif,
        ),
      );
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      throw error;
    }
  };

  /**
   * Add custom quick action
   */
  const createCustomAction = async (actionData: Omit<QuickAction, "id">) => {
    try {
      const newAction = await quickAccessService.addCustomAction(actionData);
      addCustomAction(newAction);
      return newAction;
    } catch (error) {
      console.error("Error creating custom action:", error);
      throw error;
    }
  };

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = async (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
    await refreshStats();
    await refreshActivities(); // Automatically refresh activities when time range changes
  };

  /**
   * Handle activity filter change
   */
  const handleActivityFilterChange = (filter: string) => {
    setActivityFilter(filter);
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  return {
    // Data
    activities: getFilteredActivities(),
    notifications,
    quickActions,
    customActions,
    userStats,
    linkCreationStats,
    unreadNotificationCount: getUnreadNotificationCount(),

    // Loading states
    activityLoading,
    quickAccessLoading,
    statsLoading,
    initialLoadComplete,

    // Error states
    activityError,
    quickAccessError,
    statsError,

    // UI State
    selectedTimeRange,
    activityFilter,

    // Actions
    refreshActivities,
    refreshStats,
    markNotificationsAsRead,
    createCustomAction,
    handleTimeRangeChange,
    handleActivityFilterChange,
  };
};
