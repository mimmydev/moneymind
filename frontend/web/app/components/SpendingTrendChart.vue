<template>
  <div class="h-full w-full">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { Expense } from '@/app/services/expenses';
import { AnalyticsService } from '@/app/services/analyticsService';
import { colors, chartColors, darkModeColors } from '@/app/lib/design-system';

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

const createChart = () => {
  if (!chartRef.value) return;

  const { labels, data } = AnalyticsService.processSpendingTrendData(props.expenses, props.period);

  updateDarkMode();
  const textColor = isDarkMode.value ? darkModeColors.text.primary : colors.text.secondary;
  const gridColor = isDarkMode.value ? darkModeColors.grid.primary : darkModeColors.grid.secondary;

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(chartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: AnalyticsService.getChartLabel(props.period),
          data,
          borderColor: chartColors.line.primary,
          backgroundColor: chartColors.fill.primary,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: chartColors.point.background,
          pointBorderColor: chartColors.point.border,
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
          backgroundColor: isDarkMode.value
            ? chartColors.tooltipDark.background
            : chartColors.tooltip.background,
          titleColor: chartColors.tooltip.title,
          bodyColor: chartColors.tooltip.body,
          borderColor: chartColors.tooltip.border,
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
          hoverBackgroundColor: chartColors.point.hover,
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
