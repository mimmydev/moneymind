<template>
  <div class="h-full w-full relative">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { Expense } from '../services/expenses';
import { AnalyticsService } from '../services/analytics';

Chart.register(...registerables);

interface Props {
  expenses: Expense[];
  period?: string;
}

const props = defineProps<Props>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const aggregateCategoryData = (expenses: Expense[], period: string = '30d') => {
  if (!expenses || expenses.length === 0) {
    return { labels: [], data: [], colors: [] };
  }

  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const filteredExpenses = expenses.filter((expense) => {
    return (
      expense.date && expense.category && expense.date >= startDateStr && expense.date <= endDateStr
    );
  });

  console.log(`📊 Category Filter for ${period}:`, {
    requestedRange: `${startDateStr} to ${endDateStr}`,
    totalExpenses: expenses.length,
    filteredExpenses: filteredExpenses.length,
    categories: filteredExpenses.map((e) => e.category),
  });

  const categoryCounts = new Map<string, number>();

  filteredExpenses.forEach((expense) => {
    if (expense.category) {
      const currentCount = categoryCounts.get(expense.category) || 0;
      categoryCounts.set(expense.category, currentCount + 1);
    }
  });

  const labels: string[] = [];
  const data: number[] = [];
  const colors: string[] = [];

  const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);

  sortedCategories.forEach(([category, count]) => {
    labels.push(AnalyticsService.formatCategoryName(category));
    data.push(count);
    colors.push(AnalyticsService.getCategoryColor(category));
  });

  return { labels, data, colors };
};

const createChart = () => {
  if (!chartRef.value) return;

  const { labels, data, colors } = aggregateCategoryData(props.expenses, props.period || '30d');

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBackgroundColor: colors.map((color) => {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, 0.8)`;
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'center',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 8,
            font: {
              size: 9,
              family: "'JetBrains Mono', monospace",
            },
            color: '#6b7280',
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels?.length && data.datasets.length) {
                return data.labels.map((label, index) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[index] as number;
                  return {
                    text: `${label}: ${value}`,
                    fillStyle: dataset.backgroundColor?.[index] as string,
                    strokeStyle: dataset.borderColor as string,
                    lineWidth: dataset.borderWidth as number,
                    hidden: false,
                    index: index,
                  };
                });
              }
              return [];
            },
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#10b981',
          borderWidth: 1,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce(
                (sum: number, val) => sum + (val as number),
                0
              );
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} transactions (${percentage}%)`;
            },
          },
        },
      },
      cutout: '60%',
      interaction: {
        intersect: false,
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
      },
    },
  });
};

watch(
  [() => props.expenses, () => props.period],
  () => {
    nextTick(() => {
      createChart();
    });
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    createChart();
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>
