import { ref } from 'vue';
import { useExpensesStore } from '../stores/useExpensesStore';
import type { Expense } from '../services/expenses';

export const useExpenseManagement = () => {
  const expensesStore = useExpensesStore();

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
    await expensesStore.updateExpense(updatedExpense.id, updatedExpense);
    showEditModal.value = false;
  };

  const handleDeleteConfirmed = async (expense: Expense) => {
    await expensesStore.deleteExpense(expense.id);
    showDeleteDialog.value = false;
  };

  return {
    //** Store access
    expenses: expensesStore.expenses,
    isLoading: expensesStore.isLoading,
    error: expensesStore.error,
    fetchExpenses: expensesStore.fetchExpenses,

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
