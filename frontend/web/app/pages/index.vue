<template>
  <div class="flex flex-col gap-6 px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:gap-4">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary break-words">
        📊 Dashboard
      </h1>
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <p class="text-xs sm:text-sm font-light text-text-primary">
          Overview of your financial activity
        </p>
        <p class="text-xs sm:text-sm font-medium text-text-primary truncate">
          Welcome, demo-user-malaysia
        </p>
      </div>
    </div>

    <!-- Chart -->
    <Card class="w-full bg-card text-card-foreground text-center">
      <div class="flex flex-col gap-6 sm:gap-12 h-full p-4">
        <h2 class="text-base sm:text-lg font-bold">Hero Stats Section</h2>
        
        <!-- Scrollable container for mobile -->
        <div class="overflow-x-auto">
          <div class="min-w-[500px] sm:min-w-0 h-[40vh] sm:h-[50vh] relative">
            <BarChart :chartData="chartData" :chartOptions="chartOptions" />
            <div
              v-if="loading"
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
      <StatCard
        v-for="stat in statCards"
        :key="stat.title"
        v-bind="stat"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from "vue"
import { type ChartData } from "chart.js"
import { BarChart } from "~/components/ui/charts"
import { getAnalytics, type Analytics } from "~/services/analytics"
import StatCard from "~/components/modules/dashbord/StatCard.vue"
import { centsToRM } from "../lib/utils.ts"
import { getTrend } from "../utils/getTrend.ts"
import { getExpenses, type Expense } from "~/services/expenses.ts"

// state
const loading = ref(true)
const chartData = ref<ChartData<"bar">>({ labels: [], datasets: [] })
const analytics = ref<Analytics | null>(null)
const expenses = ref<Expense[] | null>(null)

// chart options (extract once, instead of inline)
const chartOptions = {
  plugins: {
    title: {
      display: true,
      text: "Shops You’ve Been Feeding Lately",
    },
    legend: { display: false },
  },
  scales: {
    y: {
      title: { display: true, text: "Total Spent (RM)" },
      ticks: { callback: (value: number) => `RM ${value}` },
    },
  },
}

// central util: CSS color palette
const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const colorPalette = [
  "--color-expenses",
  "--color-income",
  "--color-warning",
  "--color-saving",
  "--color-transfer",
  "--color-neutral-600",
  "--color-primary-700",
].map(cssVar)

const getColorFromPalette = (i: number) => colorPalette[i % colorPalette.length]

// calculate saving rate 
const calculateSavingsRate = () => {
  if (!analytics.value) return 0
  const totalBudget = analytics.value.budgetRemaining + analytics.value.totalSpent
  return totalBudget > 0
    ? ((analytics.value.budgetRemaining / totalBudget) * 100).toFixed(1) + "%"
    : "0%"
}

// stat card config
const statCards = computed(() => [
  {
    title: "Total Balance",
    icon: "tabler:wallet",
    value: analytics.value?.budgetRemainingMYR,
    trendText: getTrend(centsToRM(analytics.value?.budgetRemaining), "balance").text,
    trendIcon: getTrend(centsToRM(analytics.value?.budgetRemaining), "balance").icon,
    trendClass: getTrend(centsToRM(analytics.value?.budgetRemaining), "balance").class,
  },
  {
    title: "Transactions",
    icon: "gg:arrow-down-o",
    value: analytics.value?.transactionCount,
    trendText: getTrend(analytics.value?.transactionCount, "transactions").text,
    trendIcon: getTrend(analytics.value?.transactionCount, "transactions").icon,
    trendClass: getTrend(analytics.value?.transactionCount, "transactions").class,
  },
  {
    title: "Savings",
    icon: "tabler:pig-money",
    value: calculateSavingsRate(),
    trendText: getTrend(parseFloat(calculateSavingsRate()), "savings").text,
    trendIcon: getTrend(parseFloat(calculateSavingsRate()), "savings").icon,
    trendClass: getTrend(parseFloat(calculateSavingsRate()), "savings").class,
  },
  {
    title: "Expenses",
    icon: "gg:arrow-up-o",
    value: analytics.value?.totalSpentMYR,
    trendText: getTrend(centsToRM(analytics.value?.totalSpent), "expenses").text,
    trendIcon: getTrend(centsToRM(analytics.value?.totalSpent), "expenses").icon,
    trendClass: getTrend(centsToRM(analytics.value?.totalSpent), "expenses").class,
  },
  {
    title: "Peak Spending Day",
    icon: "mdi:calendar-star",
    value: analytics.value?.spendingTrends?.peakSpendingDay?.date || "-",
    trendText: getTrend(centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount) , "peakSpendingDay").text,
    trendIcon: getTrend(centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount) , "peakSpendingDay").icon,
    trendClass: getTrend(centsToRM(analytics.value?.spendingTrends?.peakSpendingDay?.amount) , "peakSpendingDay").class,
  },
  {
    title: "Daily Average",
    icon: "mdi:calendar-today",
    value: analytics.value?.dailyAverageMYR || 0,
    trendText: getTrend(centsToRM(analytics.value?.spendingTrends?.dailySpending?.amount) , "dailyAverage").text,
    trendIcon: getTrend(centsToRM(analytics.value?.spendingTrends?.dailySpending?.amount) , "dailyAverage").icon,
    trendClass: getTrend(centsToRM(analytics.value?.spendingTrends?.dailySpending?.amount) , "dailyAverage").class,
  }

])

// fetch analytics data
const fetchAnalytics = async () => {
  try {
    loading.value = true
    const data = await getAnalytics()
    analytics.value = data

    // chartData.value = {
    //   labels: data.topMerchants.map((m) => m.merchant),
    //   datasets: [
    //     {
    //       data: data.topMerchants.map((m) => centsToRM(m.total)),
    //       backgroundColor: data.topMerchants.map((_, i) =>
    //         getColorFromPalette(i)
    //       ),
    //       borderRadius: 2,
    //       barPercentage: 1,
    //       categoryPercentage: 0.9,
    //       borderWidth: 0,
    //     },
    //   ],
    // }
  } catch (e) {
    console.error("Error fetching analytics:", e)
  } finally {
    loading.value = false
  }
}

const fetchExpenses = async () => {
  try {
    loading.value = true;
    const data = await getExpenses();
    expenses.value = data;

    const merchantTotals = data.reduce((acc, expense) => {
      if (!expense.merchant || expense.merchant.trim() === "") return acc;
      const merchant = expense.merchant;
      if (!acc[merchant]) {
        acc[merchant] = 0;
      }
      acc[merchant] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(merchantTotals);
    const values = Object.values(merchantTotals).map(centsToRM);

    chartData.value = {
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
  } catch (error) {
    console.error("Error fetching expenses:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await Promise.all([
    fetchAnalytics(),
    fetchExpenses()
  ])
})

</script>
