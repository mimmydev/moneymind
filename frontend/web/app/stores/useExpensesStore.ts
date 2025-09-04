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
  const fetchExpenses = async () => {
    try {
      console.log('🔄 fetchExpenses: Starting to fetch expenses...');
      isLoading.value = true;
      error.value = null;
      console.log('🔄 fetchExpenses: isLoading set to true');

      console.log('🔄 fetchExpenses: Calling getExpenses()...');
      expenses.value = await getExpenses();
      console.log(
        '✅ fetchExpenses: Successfully fetched expenses:',
        expenses.value.length,
        'expenses'
      );
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch expenses';
      console.error('❌ fetchExpenses: Error fetching expenses:', err);
    } finally {
      isLoading.value = false;
      console.log('🔄 fetchExpenses: isLoading set to false');
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const index = expenses.value.findIndex((e) => e.id === id);
    if (index !== -1) {
      expenses.value[index] = { ...expenses.value[index], ...updates } as Expense;
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
