<template>
  <div class="h-full w-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { Expense } from '../services/expenses';

Chart.register(...registerables);

interface Props {
  expenses: Expense[];
  period: string;
}

const props = defineProps<Props>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const isDarkMode = ref(false);

const updateDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark');
};

const aggregateDataByPeriod = (expenses: Expense[], period: string) => {
  if (!expenses || expenses.length === 0) {
    return { labels: [], data: [] };
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
      expense.date && expense.amount && expense.date >= startDateStr && expense.date <= endDateStr
    );
  });

  console.log(`📅 Date Range Filter for ${period}:`, {
    requestedRange: `${startDateStr} to ${endDateStr}`,
    totalExpenses: expenses.length,
    filteredExpenses: filteredExpenses.length,
    expenseDates: expenses
      .map((e) => e.date)
      .filter(Boolean)
      .sort(),
  });

  const expensesByDate = new Map<string, number>();

  filteredExpenses.forEach((expense) => {
    if (expense.date && expense.amount) {
      const dateKey = expense.date;
      const currentAmount = expensesByDate.get(dateKey) || 0;
      expensesByDate.set(dateKey, currentAmount + expense.amount);
    }
  });

  const minDate = startDate;
  const maxDate = endDate;

  switch (period) {
    case '7d':
      return aggregateDailyData(expensesByDate, minDate, maxDate);
    case '30d':
      return aggregateWeeklyData(expensesByDate, minDate, maxDate);
    case '90d':
      return aggregateBiMonthlyData(expensesByDate, minDate, maxDate);
    case '1y':
      return aggregateMonthlyData(expensesByDate, minDate, maxDate);
    default:
      return aggregateWeeklyData(expensesByDate, minDate, maxDate);
  }
};

const aggregateDailyData = (expensesByDate: Map<string, number>, minDate: Date, maxDate: Date) => {
  const labels: string[] = [];
  const data: number[] = [];

  const currentDate = new Date(minDate);
  const endDate = new Date(maxDate);

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];

    labels.push(formatDateLabel(new Date(currentDate), 'daily'));
    data.push((expensesByDate.get(dateStr) || 0) / 100);

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { labels, data };
};

const aggregateWeeklyData = (expensesByDate: Map<string, number>, minDate: Date, maxDate: Date) => {
  const labels: string[] = [];
  const data: number[] = [];

  const startDate = new Date(minDate);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const currentWeekStart = new Date(startDate);

  while (currentWeekStart <= maxDate) {
    const weekEndDate = new Date(currentWeekStart);
    weekEndDate.setDate(currentWeekStart.getDate() + 6);

    let weekTotal = 0;

    for (let d = 0; d < 7; d++) {
      const checkDate = new Date(currentWeekStart);
      checkDate.setDate(currentWeekStart.getDate() + d);
      const dateStr = checkDate.toISOString().split('T')[0];
      weekTotal += expensesByDate.get(dateStr) || 0;
    }

    labels.push(
      `${formatDateLabel(currentWeekStart, 'weekly')} - ${formatDateLabel(weekEndDate, 'weekly')}`
    );
    data.push(weekTotal / 100);

    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  return { labels, data };
};

const aggregateBiMonthlyData = (
  expensesByDate: Map<string, number>,
  minDate: Date,
  maxDate: Date
) => {
  const labels: string[] = [];
  const data: number[] = [];

  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const periods = Math.min(6, Math.ceil(totalDays / 15));
  const daysPerPeriod = Math.ceil(totalDays / periods);

  const currentDate = new Date(minDate);

  for (let periodIndex = 0; periodIndex < periods; periodIndex++) {
    const periodStartDate = new Date(currentDate);
    const periodEndDate = new Date(currentDate);
    periodEndDate.setDate(periodStartDate.getDate() + daysPerPeriod - 1);

    if (periodEndDate > maxDate) {
      periodEndDate.setTime(maxDate.getTime());
    }

    let periodTotal = 0;

    const checkDate = new Date(periodStartDate);
    while (checkDate <= periodEndDate) {
      const dateStr = checkDate.toISOString().split('T')[0];
      periodTotal += expensesByDate.get(dateStr) || 0;
      checkDate.setDate(checkDate.getDate() + 1);
    }

    labels.push(
      `${formatDateLabel(periodStartDate, 'bimonthly')} - ${formatDateLabel(periodEndDate, 'bimonthly')}`
    );
    data.push(periodTotal / 100);

    currentDate.setDate(currentDate.getDate() + daysPerPeriod);
    if (currentDate > maxDate) break;
  }

  return { labels, data };
};

const aggregateMonthlyData = (
  expensesByDate: Map<string, number>,
  minDate: Date,
  maxDate: Date
) => {
  const labels: string[] = [];
  const data: number[] = [];

  const currentDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  const lastMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  while (currentDate <= lastMonth) {
    const monthStart = new Date(currentDate);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    let monthTotal = 0;

    const checkDate = new Date(monthStart);
    while (checkDate <= monthEnd) {
      const dateStr = checkDate.toISOString().split('T')[0];
      monthTotal += expensesByDate.get(dateStr) || 0;
      checkDate.setDate(checkDate.getDate() + 1);
    }

    labels.push(formatDateLabel(monthStart, 'monthly'));
    data.push(monthTotal / 100);

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return { labels, data };
};

const formatDateLabel = (date: Date, type: string): string => {
  switch (type) {
    case 'daily':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
    case 'bimonthly':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default:
      return date.toLocaleDateString();
  }
};

const getChartLabel = (period: string): string => {
  switch (period) {
    case '7d':
      return 'Daily Spending (RM)';
    case '30d':
      return 'Weekly Spending (RM)';
    case '90d':
      return 'Bi-Monthly Spending (RM)';
    case '1y':
      return 'Monthly Spending (RM)';
    default:
      return 'Spending (RM)';
  }
};

const createChart = () => {
  if (!chartRef.value) return;

  const { labels, data } = aggregateDataByPeriod(props.expenses, props.period);

  updateDarkMode();
  const textColor = isDarkMode.value ? '#e5e7eb' : '#6b7280';
  const gridColor = isDarkMode.value ? 'rgba(75, 85, 99, 0.3)' : 'rgba(156, 163, 175, 0.2)';

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: getChartLabel(props.period),
          data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: isDarkMode.value ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#10b981',
          borderWidth: 1,
          callbacks: {
            label: (context) => `RM ${context.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: 8,
            font: {
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
            callback: (value) => `RM ${Number(value).toFixed(0)}`,
            font: {
              size: 11,
            },
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
      },
      elements: {
        point: {
          hoverBackgroundColor: '#10b981',
        },
      },
    },
  });
};

watch(
  [() => props.expenses, () => props.period, isDarkMode],
  () => {
    nextTick(() => {
      createChart();
    });
  },
  { deep: true }
);

onMounted(() => {
  updateDarkMode();

  const observer = new MutationObserver(() => {
    updateDarkMode();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  nextTick(() => {
    createChart();
  });

  onUnmounted(() => {
    observer.disconnect();
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
  }
});
</script>
