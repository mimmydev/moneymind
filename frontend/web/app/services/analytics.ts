import apiClient from "./api/index";

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