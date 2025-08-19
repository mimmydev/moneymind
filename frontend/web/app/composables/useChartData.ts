import { computed } from 'vue';
import type { ChartData } from 'chart.js';
import type { Expense } from '../services/expenses';
import { centsToRM } from '../../lib/utils';

export const useChartData = () => {
  //** Central util: CSS color palette
  const cssVar = (name: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const colorPalette = [
    '--color-expenses',
    '--color-income',
    '--color-warning',
    '--color-saving',
    '--color-transfer',
    '--color-neutral-600',
    '--color-primary-700',
  ].map(cssVar);

  const getColorFromPalette = (index: number) => colorPalette[index % colorPalette.length];

  const chartOptions = {
    plugins: {
      title: {
        display: true,
        text: "Shops You've Been Feeding Lately",
      },
      legend: { display: false },
    },
    scales: {
      y: {
        title: { display: true, text: 'Total Spent (RM)' },
        ticks: { callback: (value: number) => `RM ${value}` },
      },
    },
  };

  const generateMerchantChart = (expenses: Expense[]): ChartData<'bar'> => {
    const merchantTotals = expenses.reduce(
      (acc, expense) => {
        if (!expense.merchant || expense.merchant.trim() === '') return acc;
        const merchant = expense.merchant;
        if (!acc[merchant]) acc[merchant] = 0;
        acc[merchant] += expense.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    const labels = Object.keys(merchantTotals);
    const values = Object.values(merchantTotals).map(centsToRM);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: labels.map((_, i) => getColorFromPalette(i)),
          borderRadius: 2,
          barPercentage: 1,
          categoryPercentage: 0.9,
          borderWidth: 0,
        },
      ],
    };
  };

  return {
    generateMerchantChart,
    getColorFromPalette,
    chartOptions,
  };
};
