import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { getExpenses, type Expense } from '../services/expenses';

export const useExpensesStore = defineStore('expenses', () => {
  //** State
  const expenses = ref<Expense[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  //** Getters
  const expenseCount = computed(() => expenses.value.length);
  const totalAmount = computed(() =>
    expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  );

  //** Actions
  const fetchExpenses = async (force: boolean = false) => {
    try {
      isLoading.value = true;
      error.value = null;

      expenses.value = await getExpenses();
      console.log(
        '✅ fetchExpenses: Successfully fetched expenses:',
        expenses.value.length,
        'expenses'
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch expenses';
    } finally {
      isLoading.value = false;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const index = expenses.value.findIndex((e) => e.id === id);
      if (index !== -1) {
        expenses.value[index] = { ...expenses.value[index], ...updates } as Expense;
      }

      await fetchExpenses();
    } catch (err) {
      console.error('❌ updateExpense: Error updating expense:', err);
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    expenses.value = expenses.value.filter((e) => e.id !== id);
  };

  const addExpense = (expense: Expense) => {
    expenses.value.unshift(expense);
  };

  return {
    //** State
    expenses,
    isLoading,
    error,
    //** Getters
    expenseCount,
    totalAmount,
    //** Actions
    fetchExpenses,
    updateExpense,
    deleteExpense,
    addExpense,
  };
});
