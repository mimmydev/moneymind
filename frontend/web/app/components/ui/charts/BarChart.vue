<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { BarElement, CategoryScale, Chart as ChartJs, Legend, LinearScale, Title, Tooltip, type ChartData, type ChartOptions } from 'chart.js';
import { Bar } from 'vue-chartjs';

ChartJs.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

interface ChartProps {
  chartData: ChartData<'bar'>;
  chartOptions?: ChartOptions<'bar'>;
  yAxisLabel?: string;
  colorVar?: string; // CSS variable name
}

const props = withDefaults(defineProps<ChartProps>(), {
  chartOptions: undefined,
  yAxisLabel: '',
  colorVar: '--color-text-primary'
});

const chartRef = ref();

function getCssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

const dynamicOptions = computed<ChartOptions<'bar'>>(() => {
  const color = getCssVar(props.colorVar);
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color,
          callback: (value) => props.yAxisLabel
            ? `${props.yAxisLabel}${value}`
            : String(value)
        }
      },
      x: {
        grid: { display: false },
        ticks: { color }
      }
    },
    ...props.chartOptions
  };
});

// Re-render chart when theme changes
let observer: MutationObserver;
onMounted(() => {
  observer = new MutationObserver(() => {
    chartRef.value?.chartInstance?.update();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <Bar
    ref="chartRef"
    :data="chartData"
    :options="dynamicOptions"
  />
</template>
