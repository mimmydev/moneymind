import apiClient from './api/index';
import { getCategoryColor } from '../lib/design-system';

export interface CategoryBreakdown {
  name: string;
  total: number;
  count: number;
  percentage: number;
  avgPerTransaction: number;
  totalMYR: string;
  avgPerTransactionMYR: string;
}

export interface DailySpending {
  date: string;
  amount: number;
  amountMYR: string;
}

export interface SpendingTrends {
  dailySpending: DailySpending[];
  peakSpendingDay: DailySpending;
  lowestSpendingDay: DailySpending;
}

export interface TopMerchant {
  merchant: string;
  total: number;
  totalMYR: string;
}

export interface Analytics {
  totalSpent: number;
  totalSpentMYR: string;
  transactionCount: number;
  budgetRemaining: number;
  budgetRemainingMYR: string;
  budgetUsagePercentage: number;
  dailyAverage: number;
  dailyAverageMYR: string;
  categoryBreakdown: CategoryBreakdown[];
  spendingTrends: SpendingTrends;
  smartInsights: string[];
  topMerchants: TopMerchant[];
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    analytics: Analytics;
    period: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
  message: string;
}

export const getAnalytics = async (): Promise<Analytics> => {
  const response = await apiClient.get<AnalyticsResponse>('/analytics');
  console.log(response.data.data.analytics);

  return response.data.data.analytics;
};

export const formatCategoryName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    transport_grab: 'Grab Transport',
    transport_fuel: 'Fuel',
    transport_parking: 'Parking',
    food_mamak: 'Mamak Food',
    food_restaurant: 'Restaurant',
    food_coffee: 'Coffee',
    food_japan: 'Japanese Food',
    shopping_online: 'Online Shopping',
    shopping_offline: 'Shopping',
    entertainment: 'Entertainment',
    utilities: 'Utilities',
    rent: 'Rent',
    healthcare: 'Healthcare',
    education: 'Education',
    other_miscellaneous: 'Others',
  };

  return (
    categoryMap[category] || category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

export { getCategoryColor };
