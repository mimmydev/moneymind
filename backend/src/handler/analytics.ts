import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { expenseRepository } from '../service/expense-repository';
import { APIResponse } from '../types';

export const getAnalytics = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const period = event.queryStringParameters?.period || '30d';

    console.log(`Getting analytics for user: ${userId}, period: ${period}`);

    const validPeriods = ['7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period)) {
      return createResponse(400, {
        success: false,
        error: `Invalid period. Use one of: ${validPeriods.join(', ')}`,
      });
    }

    const dateRange = getDateRange(period);
    console.log(`Date range: ${dateRange.startDate} to ${dateRange.endDate}`);

    const result = await expenseRepository.getExpenses({
      userId,
      limit: 1000, //** Get all expenses, we'll filter in memory. Well, not good practice but this will do for MVP
    });

    console.log(`Found ${result.items.length} total expenses`);

    //** Filter by date range in memory
    const filteredExpenses = result.items.filter((expense) => {
      const expenseDate = expense.date;
      return expenseDate >= dateRange.startDate && expenseDate <= dateRange.endDate;
    });

    console.log(
      `${filteredExpenses.length} expenses in date range ${dateRange.startDate} to ${dateRange.endDate}`
    );

    const analytics = calculateAnalytics(filteredExpenses, period);

    return createResponse(200, {
      success: true,
      data: {
        analytics,
        period,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      },
      message: `Analytics calculated for ${filteredExpenses.length} expenses`,
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    });
  }
};

//** ========================================
//** UTILITY FUNCTIONS
//** ========================================

const createResponse = (statusCode: number, body: APIResponse): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body, null, 2),
});

const getUserId = (event: APIGatewayProxyEvent): string => {
  return event.queryStringParameters?.userId || 'demo-user-malaysia';
};

//** ========================================
//** ANALYTICS CALCULATION FUNCTIONS
//** ========================================

function getDateRange(period: string): { startDate: string; endDate: string } {
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

  return {
    startDate: startDate.toISOString().split('T')[0], //** YYYY-MM-DD format
    endDate: endDate.toISOString().split('T')[0],
  };
}

function calculateAnalytics(expenses: any[], period: string) {
  const totalSpent = calculateTotalSpent(expenses);
  const categoryBreakdown = calculateCategoryBreakdown(expenses);
  const spendingTrends = calculateSpendingTrends(expenses);
  const smartInsights = generateSmartInsights(expenses, period);

  return {
    //** Basic Stats
    totalSpent: totalSpent,
    totalSpentMYR: formatMalaysianCurrency(totalSpent),
    transactionCount: expenses.length,
    budgetRemaining: 50000, //** RM 500 hardcoded budget for MVP
    budgetRemainingMYR: formatMalaysianCurrency(50000 - totalSpent),
    budgetUsagePercentage: totalSpent > 0 ? Math.round((totalSpent / 50000) * 100) : 0,

    //** Average spending
    dailyAverage: expenses.length > 0 ? Math.round(totalSpent / getDaysInPeriod(period)) : 0,
    dailyAverageMYR: formatMalaysianCurrency(
      expenses.length > 0 ? Math.round(totalSpent / getDaysInPeriod(period)) : 0
    ),

    //** Category Breakdown
    categoryBreakdown,

    //** Spending Trends
    spendingTrends,

    //** Malaysian Smart Insights
    smartInsights,

    //** Top merchants
    topMerchants: getTopMerchants(expenses),
  };
}

function calculateTotalSpent(expenses: any[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

function calculateCategoryBreakdown(expenses: any[]) {
  if (expenses.length === 0) return [];

  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || 'other_miscellaneous';
    if (!acc[category]) {
      acc[category] = {
        name: category,
        total: 0,
        count: 0,
        percentage: 0,
        avgPerTransaction: 0,
      };
    }
    acc[category].total += expense.amount;
    acc[category].count += 1;
    return acc;
  }, {});

  const totalSpent = calculateTotalSpent(expenses);

  const categories = Object.values(categoryTotals).map((category: any) => ({
    ...category,
    totalMYR: formatMalaysianCurrency(category.total),
    percentage: totalSpent > 0 ? Math.round((category.total / totalSpent) * 100) : 0,
    avgPerTransaction: Math.round(category.total / category.count),
    avgPerTransactionMYR: formatMalaysianCurrency(Math.round(category.total / category.count)),
  }));

  return categories.sort((a, b) => b.total - a.total);
}

function calculateSpendingTrends(expenses: any[]) {
  if (expenses.length === 0) {
    return {
      dailySpending: [],
      peakSpendingDay: null,
      lowestSpendingDay: null,
    };
  }

  const dailySpending = expenses.reduce((acc, expense) => {
    const date = expense.date;
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {});

  const trendData = Object.entries(dailySpending)
    .map(([date, amount]) => ({
      date,
      amount: amount as number,
      amountMYR: formatMalaysianCurrency(amount as number),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (trendData.length === 0) {
    return {
      dailySpending: [],
      peakSpendingDay: null,
      lowestSpendingDay: null,
    };
  }

  return {
    dailySpending: trendData,
    peakSpendingDay: trendData.reduce(
      (max, day) => (day.amount > max.amount ? day : max),
      trendData[0]
    ),
    lowestSpendingDay: trendData.reduce(
      (min, day) => (day.amount < min.amount ? day : min),
      trendData[0]
    ),
  };
}

function generateSmartInsights(expenses: any[], period: string): string[] {
  const insights: string[] = [];

  if (expenses.length === 0) {
    insights.push('📊 No expenses found for this period');
    return insights;
  }

  const categoryBreakdown = calculateCategoryBreakdown(expenses);
  const totalSpent = calculateTotalSpent(expenses);

  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];

    if (topCategory.name === 'food_mamak') {
      insights.push(`🍛 Mamak is your top expense at ${topCategory.percentage}% of spending`);
      insights.push(
        `💡 You spent ${topCategory.totalMYR} on mamak food - that's ${topCategory.count} visits!`
      );
    } else if (topCategory.name.startsWith('food_')) {
      insights.push(
        `🍽️ ${topCategory.name.replace('food_', '').replace('_', ' ')} makes up ${topCategory.percentage}% of your spending`
      );
    } else {
      insights.push(
        `📊 Your top spending category is ${topCategory.name.replace('_', ' ')} at ${topCategory.percentage}%`
      );
    }
  }

  //** Transport insights
  const transportExpenses = expenses.filter(
    (exp) =>
      exp.category?.includes('transport') ||
      exp.description?.toLowerCase().includes('grab') ||
      exp.description?.toLowerCase().includes('touch')
  );

  if (transportExpenses.length > 0) {
    const transportTotal = transportExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    insights.push(
      `🚗 Transport expenses: ${formatMalaysianCurrency(transportTotal)} (${transportExpenses.length} transactions)`
    );
  }

  //** Budget insights
  if (totalSpent > 0) {
    const budgetUsed = (totalSpent / 50000) * 100;
    if (budgetUsed > 80) {
      insights.push(`⚠️ You've used ${Math.round(budgetUsed)}% of your RM 500 budget`);
    } else if (budgetUsed > 50) {
      insights.push(
        `💰 You've used ${Math.round(budgetUsed)}% of your budget - still within limits`
      );
    } else {
      insights.push(`✅ Great budgeting! Only ${Math.round(budgetUsed)}% of budget used`);
    }
  }

  //** Confidence insights
  const lowConfidenceExpenses = expenses.filter((exp) => exp.confidence && exp.confidence < 60);
  if (lowConfidenceExpenses.length > 0) {
    insights.push(`🔍 ${lowConfidenceExpenses.length} transactions need category review`);
  }

  return insights.slice(0, 4);
}

function getTopMerchants(expenses: any[]) {
  if (expenses.length === 0) return [];

  const merchantTotals = expenses.reduce((acc, expense) => {
    const merchant = expense.merchant || 'Unknown';
    acc[merchant] = (acc[merchant] || 0) + expense.amount;
    return acc;
  }, {});

  return Object.entries(merchantTotals)
    .map(([merchant, total]) => ({
      merchant,
      total: total as number,
      totalMYR: formatMalaysianCurrency(total as number),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
}

function getDaysInPeriod(period: string): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '1y':
      return 365;
    default:
      return 30;
  }
}

function formatMalaysianCurrency(cents: number): string {
  const ringgit = cents / 100;
  return `RM ${ringgit.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}
