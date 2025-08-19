import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import { getAnalytics, type Analytics } from '../services/analytics';

export const useAnalyticsStore = defineStore('analytics', () => {
  //** State
  const analytics = ref<Analytics | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  //** Actions
  const fetchAnalytics = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      analytics.value = await getAnalytics();
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch analytics';
      console.error('Error fetching analytics:', err);
    } finally {
      isLoading.value = false;
    }
  };

  const clearAnalytics = () => {
    analytics.value = null;
    error.value = null;
  };

  return {
    //** State
    analytics,
    isLoading,
    error,
    //** Actions
    fetchAnalytics,
    clearAnalytics,
  };
});
