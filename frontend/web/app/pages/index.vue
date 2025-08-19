<template>
  <PageContainer title="📊 Dashboard" subtitle="Overview of your financial activity">
    <template #headerContent>
      <div class="flex justify-end">
        <p class="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
          Welcome, demo-user-malaysia
        </p>
      </div>
    </template>

    <!-- Chart -->
    <Card class="w-full bg-card text-card-foreground text-center">
      <div class="flex flex-col gap-6 sm:gap-12 h-full p-4">
        <h2 class="text-base sm:text-lg font-bold">Hero Stats Section</h2>
        <div class="overflow-x-auto">
          <div class="min-w-[500px] sm:min-w-0 h-[40vh] sm:h-[50vh] relative">
            <BarChart :chartData="chartData" :chartOptions="chartOptions" />
            <div
              v-if="isLoading"
              class="absolute inset-0 flex items-center justify-center bg-white/70 text-sm sm:text-base"
            >
              <p>Loading chart data...</p>
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 w-full">
      <StatCard v-for="stat in statCards" :key="stat.title" v-bind="stat" />
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
import { onMounted, computed, toRef } from 'vue';
import { BarChart } from '@/app/components/ui/charts';
import StatCard from '@/app/components/modules/dashbord/StatCard.vue';
import { useExpensesStore } from '@/app/stores/useExpensesStore';
import { useAnalyticsStore } from '@/app/stores/useAnalyticsStore';
import { useChartData } from '@/app/composables/useChartData';
import { useStatistics } from '@/app/composables/useStatistics';

//** Stores
const expensesStore = useExpensesStore();
const analyticsStore = useAnalyticsStore();

//** Composables
const { generateMerchantChart, chartOptions } = useChartData();
const { statCards } = useStatistics(toRef(analyticsStore, 'analytics'));

//** Computed
const isLoading = computed(() => expensesStore.isLoading || analyticsStore.isLoading);

const chartData = computed(() => generateMerchantChart(expensesStore.expenses));

//** Lifecycle
onMounted(async () => {
  await Promise.all([expensesStore.fetchExpenses(), analyticsStore.fetchAnalytics()]);
});
</script>
