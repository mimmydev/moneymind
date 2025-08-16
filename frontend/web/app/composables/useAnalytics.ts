import { ref, onMounted, onUnmounted, type Ref } from 'vue';
import {
  getAnalytics,
  type Analytics,
  formatCategoryName,
  getCategoryColor,
} from '../services/analytics';
import { getExpensesByPeriod, type Expense } from '../services/expenses';

export interface AnalyticsPeriod {
  value: string;
  label: string;
}

export interface UseAnalyticsReturn {
  loading: Ref<boolean>;
  error: Ref<string | null>;
  analyticsData: Ref<Analytics | null>;
  expensesData: Ref<Expense[]>;
  selectedPeriod: Ref<string>;
  periods: AnalyticsPeriod[];

  selectPeriod: (period: string) => void;
  fetchAnalytics: () => Promise<void>;
  formatCategoryNameFn: (category: string) => string;
  getCategoryColorFn: (category: string) => string;

  initialize: () => void;
  cleanup: () => void;
}

export function useAnalytics(): UseAnalyticsReturn {
  const loading = ref(true);
  const error = ref<string | null>(null);
  const analyticsData = ref<Analytics | null>(null);
  const expensesData = ref<Expense[]>([]);
  const selectedPeriod = ref('30d');
  const isMounted = ref(false);

  const periods: AnalyticsPeriod[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '1y', label: '1 Year' },
  ];

  const selectPeriod = (period: string) => {
    selectedPeriod.value = period;
    fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    try {
      loading.value = true;
      error.value = null;

      await new Promise((resolve) => setTimeout(resolve, 100));

      const [analytics, expenses] = await Promise.all([
        getAnalytics(),
        getExpensesByPeriod(selectedPeriod.value),
      ]);

      if (isMounted.value) {
        analyticsData.value = analytics;
        expensesData.value = expenses;
      }
    } catch (err) {
      if (isMounted.value) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch analytics';
        console.error('Error fetching analytics:', err);
      }
    } finally {
      if (isMounted.value) {
        loading.value = false;
      }
    }
  };

  const formatCategoryNameFn = (category: string): string => {
    return formatCategoryName(category);
  };

  const getCategoryColorFn = (category: string): string => {
    return getCategoryColor(category);
  };

  const initialize = () => {
    isMounted.value = true;
    fetchAnalytics();
  };

  const cleanup = () => {
    isMounted.value = false;
  };

  onMounted(() => {
    initialize();
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    loading,
    error,
    analyticsData,
    expensesData,
    selectedPeriod,
    periods,

    selectPeriod,
    fetchAnalytics,
    formatCategoryNameFn,
    getCategoryColorFn,

    initialize,
    cleanup,
  };
}
