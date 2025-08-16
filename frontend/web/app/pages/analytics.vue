<template>
  <div class="bg-gray-50 dark:bg-gray-900 p-4">
    <div class="mb-5 flex justify-between flex-col lg:flex-row">
      <div class="flex flex-col">
        <h1 class="text-5xl font-extrabold text-gray-900 dark:text-white mb-1">ANALYTICS</h1>
        <p class="text-sm ml-6 text-gray-600 dark:text-gray-300">
          Turn data into actionable insights
        </p>
      </div>

      <div class="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 gap-1 max-h-12 mt-4 lg:mt-0">
        <button
          v-for="period in periods"
          :key="period.value"
          @click="selectPeriod(period.value)"
          :class="[
            'px-2 py-1 rounded-md text-sm font-medium transition-all duration-200 ease-in-out',
            selectedPeriod === period.value
              ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-500 shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-600/50',
          ]"
        >
          {{ period.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>

    <div v-else-if="analyticsData" style="font-family: 'JetBrains Mono', monospace">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-6">
        <Dashboard
          title="Total Spent"
          :value="analyticsData.totalSpentMYR"
          icon-class="pi-wallet"
        />

        <Dashboard
          title="Daily Average"
          :value="analyticsData.dailyAverageMYR"
          icon-class="pi-calendar"
        />

        <Dashboard
          title="Transaction"
          :value="analyticsData.transactionCount"
          icon-class="pi-arrow-right-arrow-left"
        />

        <Dashboard
          title="Categories"
          :value="analyticsData.categoryBreakdown.length"
          icon-class="pi-arrow-right-arrow-left"
        />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-6">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 max-h-[300px]"
        >
          <div class="flex justify-center mb-4">
            <h3 class="text-xl text-gray-900 dark:text-white">Spending Trend</h3>
          </div>
          <div class="h-54">
            <SpendingTrendChart :expenses="expensesData" :period="selectedPeriod" />
          </div>
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 max-h-[300px]"
        >
          <div class="flex justify-center mb-4">
            <h3 class="text-xl text-gray-900 dark:text-white">Category Breakdown</h3>
          </div>

          <div v-if="expensesData && expensesData.length > 0" class="h-54">
            <CategoryBreakdownChart :expenses="expensesData" :period="selectedPeriod" />
          </div>
        </div>
      </div>

      <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6"
      >
        <div>
          <p class="flex justify-center mt-2 text-gray-600 dark:text-gray-300 text-sm">
            Category Analysis
          </p>
        </div>
        <hr class="text-gray-200 dark:text-gray-600 mt-2" />
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th
                  class="text-left text-sm font-extralight py-3 px-4 text-gray-600 dark:text-gray-300"
                >
                  Category
                </th>
                <th
                  class="text-right text-sm font-extralight py-3 px-4 text-gray-600 dark:text-gray-300"
                >
                  Amount (RM)
                </th>
                <th
                  class="text-left text-sm font-extralight py-3 px-4 text-gray-600 dark:text-gray-300"
                >
                  Txns
                </th>
                <th
                  class="text-left text-sm font-extralight py-3 px-4 text-gray-600 dark:text-gray-300"
                >
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-if="analyticsData.categoryBreakdown && analyticsData.categoryBreakdown.length > 0"
                v-for="category in analyticsData.categoryBreakdown"
                :key="category.name"
                class="border-b border-gray-100 dark:border-gray-800 text-sm font-extralight"
              >
                <td class="py-3 px-4">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: getCategoryColorFn(category.name) }"
                    ></div>
                    <span class="font-medium text-gray-900 dark:text-white">{{
                      formatCategoryNameFn(category.name)
                    }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-red-600 dark:text-red-400 font-medium flex justify-end">
                  {{ category.totalMYR }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ category.count }}
                </td>
                <td class="py-3 px-4 text-gray-600 dark:text-gray-400">
                  {{ category.percentage }}%
                </td>
              </tr>

              <tr
                v-if="
                  !analyticsData.categoryBreakdown || analyticsData.categoryBreakdown.length === 0
                "
              >
                <td colspan="4" class="py-8 px-4 text-center text-gray-500 dark:text-gray-400">
                  <div class="flex flex-col items-center space-y-2">
                    <p>No category data available</p>
                    <p class="text-sm">Try selecting a different time period</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <div class="pi pi-exclamation-circle text-gray-900 dark:text-white"></div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Smart Insights</h3>
      </div>

      <div
        v-for="(insight, index) in analyticsData.smartInsights"
        :key="index"
        class="flex items-start space-x-3 mt-1"
      >
        <div class="w-1 h-1 bg-green-600 dark:bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
        <p class="text-green-600 dark:text-green-400 text-sm">{{ insight }}</p>
      </div>
    </div>

    <div v-else-if="error" class="text-center py-20">
      <div class="text-red-600 dark:text-red-400 mb-4"></div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to load analytics
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
      <button
        @click="fetchAnalytics"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import SpendingTrendChart from '@/app/components/SpendingTrendChart.vue';
import CategoryBreakdownChart from '@/app/components/CategoryBreakdownChart.vue';
import Dashboard from '@/app/components/Dashboard.vue';
import { useAnalytics } from '@/app/composables/useAnalytics';

const {
  loading,
  error,
  analyticsData,
  expensesData,
  selectedPeriod,
  periods,
  selectPeriod,
  fetchAnalytics,
  formatCategoryNameFn,
  getCategoryColorFn,
} = useAnalytics();
</script>

<style scoped></style>
