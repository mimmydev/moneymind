import { computed, type Ref, type ComputedRef } from 'vue';
import type { Analytics } from '../services/analytics';
import { centsToRM } from '../../lib/utils';
import { getTrend } from '../../utils/getTrend';

export const useStatistics = (analytics: Ref<Analytics | null>) => {
  const calculateSavingsRate = computed(() => {
    if (!analytics.value) return '0%';
    const totalBudget = analytics.value.budgetRemaining + analytics.value.totalSpent;
    return totalBudget > 0
      ? ((analytics.value.budgetRemaining / totalBudget) * 100).toFixed(1) + '%'
      : '0%';
  });

  const statCards = computed(() => [
    {
      title: 'Total Balance',
      icon: 'tabler:wallet',
      value: analytics.value?.budgetRemainingMYR || '0',
      trendText: getTrend(centsToRM(analytics.value?.budgetRemaining || 0), 'balance').text,
      trendIcon: getTrend(centsToRM(analytics.value?.budgetRemaining || 0), 'balance').icon,
      trendClass: getTrend(centsToRM(analytics.value?.budgetRemaining || 0), 'balance').class,
    },
    {
      title: 'Transactions',
      icon: 'gg:arrow-down-o',
      value: analytics.value?.transactionCount?.toString() || '0',
      trendText: getTrend(analytics.value?.transactionCount || 0, 'transactions').text,
      trendIcon: getTrend(analytics.value?.transactionCount || 0, 'transactions').icon,
      trendClass: getTrend(analytics.value?.transactionCount || 0, 'transactions').class,
    },
    {
      title: 'Savings',
      icon: 'tabler:pig-money',
      value: calculateSavingsRate.value,
      trendText: getTrend(parseFloat(calculateSavingsRate.value), 'savings').text,
      trendIcon: getTrend(parseFloat(calculateSavingsRate.value), 'savings').icon,
      trendClass: getTrend(parseFloat(calculateSavingsRate.value), 'savings').class,
    },
    {
      title: 'Expenses',
      icon: 'gg:arrow-up-o',
      value: analytics.value?.totalSpentMYR || '0',
      trendText: getTrend(centsToRM(analytics.value?.totalSpent || 0), 'expenses').text,
      trendIcon: getTrend(centsToRM(analytics.value?.totalSpent || 0), 'expenses').icon,
      trendClass: getTrend(centsToRM(analytics.value?.totalSpent || 0), 'expenses').class,
    },
    {
      title: 'Peak Spending Day',
      icon: 'mdi:calendar-star',
      value: analytics.value?.spendingTrends?.peakSpendingDay?.date || '-',
      trendText: getTrend(
        centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount || 0),
        'peakSpendingDay'
      ).text,
      trendIcon: getTrend(
        centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount || 0),
        'peakSpendingDay'
      ).icon,
      trendClass: getTrend(
        centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount || 0),
        'peakSpendingDay'
      ).class,
    },
    {
      title: 'Daily Average',
      icon: 'mdi:calendar-today',
      value: analytics.value?.dailyAverageMYR || '0',
      trendText: getTrend(
        centsToRM(analytics.value?.spendingTrends?.dailySpending?.[0]?.amount || 0),
        'dailyAverage'
      ).text,
      trendIcon: getTrend(
        centsToRM(analytics.value?.spendingTrends?.dailySpending?.[0]?.amount || 0),
        'dailyAverage'
      ).icon,
      trendClass: getTrend(
        centsToRM(analytics.value?.spendingTrends?.dailySpending?.[0]?.amount || 0),
        'dailyAverage'
      ).class,
    },
  ]);

  return {
    calculateSavingsRate,
    statCards,
  };
};
