import apiClient from './api/index';

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

export interface SpendingCategory {
  name: string;
  total: number;
  count: number;
  percentage: number;
  avgPerTransaction: number;
  totalMYR: string;
  avgPerTransactionMYR: string;
}

export interface TopMerchant {
  merchant: string;
  total: number;
  totalMYR: string;
}

export interface SpendingTrend {
  date: string;
  amount: number;
  amountMYR: string;
}

export interface SpendingTrends {
  dailySpending: SpendingTrend[];
  peakSpendingDay: SpendingTrend;
  lowestSpendingDay: SpendingTrend;
}

export interface AnalyticsData {
  totalSpent: number;
  totalSpentMYR: string;
  transactionCount: number;
  budgetRemaining: number;
  budgetRemainingMYR: string;
  budgetUsagePercentage: number;
  dailyAverage: number;
  dailyAverageMYR: string;
  categoryBreakdown: SpendingCategory[];
  spendingTrends: SpendingTrends;
  smartInsights: string[];
  topMerchants: TopMerchant[];
  spendingByCategory?: SpendingCategory[];
  insights?: string[];
  budgetUsed?: number;
  budgetUsedMYR?: string;
  avgTransactionAmount?: number;
  avgTransactionAmountMYR?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  data: {
    analytics: AnalyticsData;
    period: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
  message: string;
}

export class AnalyticsService {
  static async getAnalytics(
    period: string = '30d',
    userId: string = 'demo-user-malaysia'
  ): Promise<AnalyticsData> {
    try {
      const response = await apiClient.get<AnalyticsResponse>(
        `/analytics?period=${period}&userId=${userId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }

      const analytics = response.data.data.analytics;
      if (analytics.categoryBreakdown) {
        analytics.spendingByCategory = analytics.categoryBreakdown.map((cat) => ({
          name: cat.name,
          total: cat.total,
          count: cat.count,
          percentage: cat.percentage,
          avgPerTransaction: cat.avgPerTransaction,
          totalMYR: cat.totalMYR,
          avgPerTransactionMYR: cat.avgPerTransactionMYR,
        }));
      }

      if (analytics.smartInsights) {
        analytics.insights = analytics.smartInsights;
      }

      if (analytics.budgetUsagePercentage !== undefined) {
        analytics.budgetUsed = analytics.budgetUsagePercentage;
        const totalBudget = analytics.totalSpent + analytics.budgetRemaining;
        analytics.budgetUsedMYR = `${analytics.totalSpentMYR} of RM ${(totalBudget / 100).toFixed(2)}`;
      }

      if (analytics.transactionCount > 0) {
        analytics.avgTransactionAmount = Math.round(
          analytics.totalSpent / analytics.transactionCount
        );
        analytics.avgTransactionAmountMYR = `RM ${(analytics.avgTransactionAmount / 100).toFixed(2)}`;
      }

      return analytics;
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      throw error;
    }
  }

  static formatCategoryName(category: string): string {
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
  }

  static getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      transport_grab: '#3b82f6',
      transport_fuel: '#1e40af',
      transport_parking: '#60a5fa',
      food_mamak: '#ef4444',
      food_restaurant: '#f97316',
      food_coffee: '#a855f7',
      food_japan: '#84cc16',
      shopping_online: '#10b981',
      shopping_offline: '#8b5cf6',
      entertainment: '#ec4899',
      utilities: '#6b7280',
      rent: '#059669',
      healthcare: '#dc2626',
      education: '#7c3aed',
      other_miscellaneous: '#f59e0b',
    };

    return colorMap[category] || '#6b7280';
  }
}
