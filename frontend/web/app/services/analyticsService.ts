import type { Expense } from '@/services/expenses';
import { formatCategoryName, getCategoryColor } from './analytics';

export interface CategoryBreakdownData {
  labels: string[];
  data: number[];
  colors: string[];
}

export interface SpendingTrendData {
  labels: string[];
  data: number[];
}

export interface ChartDataProcessorOptions {
  period?: string;
}

export class AnalyticsService {
  static processCategoryBreakdownData(
    expenses: Expense[],
    period: string = '30d'
  ): CategoryBreakdownData {
    if (!expenses || expenses.length === 0) {
      return { labels: [], data: [], colors: [] };
    }

    const { startDate, endDate } = this.getDateRange(period, expenses);
    const startDateStr = startDate.toISOString().split('T')[0]!;
    const endDateStr = endDate.toISOString().split('T')[0]!;

    const filteredExpenses = expenses.filter((expense) => {
      if (!expense.date || !expense.category) return false;
      const expenseDate = expense.date as string;
      return expenseDate >= startDateStr && expenseDate <= endDateStr;
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
      labels.push(formatCategoryName(category));
      data.push(count);
      colors.push(getCategoryColor(category));
    });

    return { labels, data, colors };
  }

  static processSpendingTrendData(expenses: Expense[], period: string = '30d'): SpendingTrendData {
    if (!expenses || expenses.length === 0) {
      return { labels: [], data: [] };
    }

    const { startDate, endDate } = this.getDateRange(period, expenses);
    const startDateStr = startDate.toISOString().split('T')[0]!;
    const endDateStr = endDate.toISOString().split('T')[0]!;

    const filteredExpenses = expenses.filter((expense) => {
      if (!expense.date || !expense.amount) return false;
      const expenseDate = expense.date as string;
      return expenseDate >= startDateStr && expenseDate <= endDateStr;
    });

    console.log(`📅 Date Range Filter for ${period}:`, {
      requestedRange: `${startDateStr} to ${endDateStr}`,
      totalExpenses: expenses.length,
      filteredExpenses: filteredExpenses.length,
      expenseDates: expenses
        .map((e) => e.date)
        .filter(Boolean)
        .sort(),
      sampleFilteredDates: filteredExpenses
        .slice(0, 5)
        .map((e) => ({ date: e.date, amount: e.amount })),
    });

    const expensesByDate = new Map<string, number>();

    filteredExpenses.forEach((expense) => {
      if (expense.date && expense.amount) {
        const dateKey = expense.date as string;
        const currentAmount = expensesByDate.get(dateKey) || 0;
        expensesByDate.set(dateKey, currentAmount + expense.amount);
      }
    });

    switch (period) {
      case '7d':
        return this.aggregateDailyData(expensesByDate, startDate, endDate);
      case '30d':
        return this.aggregateWeeklyData(expensesByDate, startDate, endDate);
      case '90d':
        return this.aggregateBiMonthlyData(expensesByDate, startDate, endDate);
      case '1y':
        return this.aggregateMonthlyData(expensesByDate, startDate, endDate);
      default:
        return this.aggregateWeeklyData(expensesByDate, startDate, endDate);
    }
  }

  static getChartLabel(period: string): string {
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
  }

  private static getDateRange(
    period: string,
    expenses?: Expense[]
  ): { startDate: Date; endDate: Date } {
    let endDate = new Date();

    if (expenses && expenses.length > 0) {
      const validExpenseDates = expenses
        .map((e) => e.date)
        .filter(Boolean)
        .map((date) => new Date(date))
        .filter((date) => !isNaN(date.getTime()))
        .sort((a, b) => b.getTime() - a.getTime());

      if (validExpenseDates.length > 0) {
        endDate = validExpenseDates[0]!;

        const now = new Date();
        if (endDate > now) {
          endDate = now;
        }
      }
    }

    const startDate = new Date(endDate);

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

    console.log(`🗓️ Calculated date range for ${period}:`, {
      endDate: endDate.toISOString().split('T')[0],
      startDate: startDate.toISOString().split('T')[0],
      hasExpenses: expenses ? expenses.length : 0,
    });

    return { startDate, endDate };
  }

  private static aggregateDailyData(
    expensesByDate: Map<string, number>,
    minDate: Date,
    maxDate: Date
  ): SpendingTrendData {
    const labels: string[] = [];
    const data: number[] = [];

    const currentDate = new Date(minDate);
    const endDate = new Date(maxDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]!;

      labels.push(this.formatDateLabel(new Date(currentDate), 'daily'));
      data.push((expensesByDate.get(dateStr) || 0) / 100);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return { labels, data };
  }

  private static aggregateWeeklyData(
    expensesByDate: Map<string, number>,
    minDate: Date,
    maxDate: Date
  ): SpendingTrendData {
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
        const dateStr = checkDate.toISOString().split('T')[0]!;
        weekTotal += expensesByDate.get(dateStr) || 0;
      }

      labels.push(
        `${this.formatDateLabel(currentWeekStart, 'weekly')} - ${this.formatDateLabel(
          weekEndDate,
          'weekly'
        )}`
      );
      data.push(weekTotal / 100);

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    return { labels, data };
  }

  private static aggregateBiMonthlyData(
    expensesByDate: Map<string, number>,
    minDate: Date,
    maxDate: Date
  ): SpendingTrendData {
    const labels: string[] = [];
    const data: number[] = [];

    const totalDays =
      Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
        const dateStr = checkDate.toISOString().split('T')[0]!;
        periodTotal += expensesByDate.get(dateStr) || 0;
        checkDate.setDate(checkDate.getDate() + 1);
      }

      labels.push(
        `${this.formatDateLabel(periodStartDate, 'bimonthly')} - ${this.formatDateLabel(
          periodEndDate,
          'bimonthly'
        )}`
      );
      data.push(periodTotal / 100);

      currentDate.setDate(currentDate.getDate() + daysPerPeriod);
      if (currentDate > maxDate) break;
    }

    return { labels, data };
  }

  private static aggregateMonthlyData(
    expensesByDate: Map<string, number>,
    minDate: Date,
    maxDate: Date
  ): SpendingTrendData {
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
        const dateStr = checkDate.toISOString().split('T')[0]!;
        monthTotal += expensesByDate.get(dateStr) || 0;
        checkDate.setDate(checkDate.getDate() + 1);
      }

      labels.push(this.formatDateLabel(monthStart, 'monthly'));
      data.push(monthTotal / 100);

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return { labels, data };
  }

  private static formatDateLabel(date: Date, type: string): string {
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
  }
}
