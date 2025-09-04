import { ref, onMounted, computed } from 'vue';
import { useExpensesStore } from '../stores/useExpensesStore';
import { deleteExpense, updateExpense } from '../services/expenses';
import type { Expense } from '../services/expenses';

export const useExpenseManagement = () => {
  const expensesStore = useExpensesStore();

  //** Create a load function that can be awaited
  const loadExpenses = async () => {
    await expensesStore.fetchExpenses();
  };

  //** Auto-load only on client-side mount
  onMounted(async () => {
    if (expensesStore.expenses.length === 0) {
      await loadExpenses();
    } else {
      console.log('useExpenseManagement: Skipping - expenses already exist');
    }
  });

  //** Modal states
  const showViewModal = ref(false);
  const showEditModal = ref(false);
  const showDeleteDialog = ref(false);
  const selectedExpense = ref<Expense | null>(null);

  //** Modal handlers
  const handleViewExpense = (expense: Expense) => {
    selectedExpense.value = expense;
    showViewModal.value = true;
  };

  const handleEditExpense = (expense: Expense) => {
    selectedExpense.value = expense;
    showEditModal.value = true;
    showViewModal.value = false;
  };

  const handleDeleteExpense = (expense: Expense) => {
    selectedExpense.value = expense;
    showDeleteDialog.value = true;
  };

  const handleSaveExpense = async (updatedExpense: Expense) => {
    if (!selectedExpense.value) {
      console.error('No selected expense for update');
      return;
    }

    try {
      const updatedData = await updateExpense(
        updatedExpense.id,
        selectedExpense.value.date,
        updatedExpense
      );

      console.log('✅ handleSaveExpense: Service call successful, updating store...');

      //** Update the store with the response from the API
      await expensesStore.updateExpense(updatedData.id, updatedData);

      showEditModal.value = false;
    } catch (error) {
      console.error('❌ handleSaveExpense: Failed to update expense:', error);
    }
  };

  const handleDeleteConfirmed = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id, expense.date);
      await expensesStore.deleteExpense(expense.id);
      showDeleteDialog.value = false;
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return {
    //** Store access - using computed to ensure reactivity
    expenses: computed(() => expensesStore.expenses),
    isLoading: computed(() => expensesStore.isLoading),
    error: computed(() => expensesStore.error),
    fetchExpenses: expensesStore.fetchExpenses,
    loadExpenses,

    //** Modal states
    showViewModal,
    showEditModal,
    showDeleteDialog,
    selectedExpense,

    //** Handlers
    handleViewExpense,
    handleEditExpense,
    handleDeleteExpense,
    handleSaveExpense,
    handleDeleteConfirmed,
  };
};
