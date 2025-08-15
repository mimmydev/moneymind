<template>
  <div class="h-full w-full relative">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import type { Expense } from '@/app/services/expenses';
import { AnalyticsService } from '@/app/services/analyticsService';
import { colors as designColors, chartColors } from '@/app/lib/design-system';

Chart.register(...registerables);

interface Props {
  expenses: Expense[];
  period?: string;
}

const props = defineProps<Props>();

const chartRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const createChart = () => {
  if (!chartRef.value) return;

  const { labels, data, colors } = AnalyticsService.processCategoryBreakdownData(
    props.expenses,
    props.period || '30d'
  );

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
          borderColor: designColors.background.primary,
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
            color: designColors.text.secondary,
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
          backgroundColor: chartColors.tooltip.background,
          titleColor: chartColors.tooltip.title,
          bodyColor: chartColors.tooltip.body,
          borderColor: chartColors.tooltip.border,
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
