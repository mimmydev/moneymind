<template>
  <PageContainer title="💳 Expenses" subtitle="Manage and view your transaction history">
    <div class="space-y-6">
      <ExpenseDataTable
        :columns="columns"
        :data="filteredExpenses"
        :is-loading="isLoading"
        @upload="handleUpload"
        @row-click="handleViewExpense"
        @edit-expense="handleEditExpense"
        @delete-expense="handleDeleteExpense"
      />
    </div>

    <ExpenseViewModal
      v-model:open="showViewModal"
      :expense="selectedExpense"
      @edit="handleEditExpense"
    />

    <ExpenseEditModal
      v-model:open="showEditModal"
      :expense="selectedExpense"
      :is-saving="isSaving"
      @save="handleSaveExpense"
    />

    <ExpenseDeleteDialog
      v-model:open="showDeleteDialog"
      :expense="selectedExpense"
      @delete="handleDeleteConfirmed"
    />

    <Dialog v-model:open="showUploadDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Expenses</DialogTitle>
          <DialogDescription>
            Upload your expenses via CSV or JSON file. Maximum 500 expenses for CSV, 100 for JSON.
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid gap-2">
            <Label for="file">Choose file</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.json"
              @change="handleFileSelect"
              ref="fileInput"
            />
          </div>
          <div v-if="selectedFile" class="text-sm text-muted-foreground">
            Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showUploadDialog = false">Cancel</Button>
          <Button @click="uploadFile" :disabled="!selectedFile || isUploading">
            <Upload v-if="!isUploading" class="mr-2 h-4 w-4" />
            <Loader2 v-else class="mr-2 h-4 w-4 animate-spin" />
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </PageContainer>
</template>

<script setup lang="ts">
useHead({
  title: 'Expenses',
});

import { ref, computed } from 'vue';
import { Upload, Loader2 } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { columns } from '@/app/components/expenses/columns';
import ExpenseDataTable from '@/app/components/expenses/ExpenseDataTable.vue';
import ExpenseViewModal from '@/app/components/expenses/ExpenseViewModal.vue';
import ExpenseEditModal from '@/app/components/expenses/ExpenseEditModal.vue';
import ExpenseDeleteDialog from '@/app/components/expenses/ExpenseDeleteDialog.vue';
import { useExpenseManagement } from '@/app/composables/useExpenseManagement';
import { useExpensesStore } from '@/app/stores/useExpensesStore';
import { uploadExpenses } from '@/app/services/expenses';

//** Use composable for all expense management logic
const {
  expenses,
  isLoading,
  error,
  fetchExpenses,
  showViewModal,
  showEditModal,
  showDeleteDialog,
  selectedExpense,
  isSaving,
  handleViewExpense,
  handleEditExpense,
  handleDeleteExpense,
  handleSaveExpense,
  handleDeleteConfirmed,
} = useExpenseManagement();

//** Upload logic
const showUploadDialog = ref(false);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const fileInput = ref<HTMLInputElement>();
const searchQuery = ref('');

//** Computed
const filteredExpenses = computed(() => {
  if (!searchQuery.value) return expenses.value;

  const query = searchQuery.value.toLowerCase();
  return expenses.value.filter(
    (expense) =>
      expense.description.toLowerCase().includes(query) ||
      expense.merchant.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query)
  );
});

//** Upload methods
function handleUpload() {
  showUploadDialog.value = true;
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  selectedFile.value = target.files?.[0] || null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadFile() {
  if (!selectedFile.value) return;

  try {
    isUploading.value = true;

    //** Upload file using the service
    const result = await uploadExpenses(selectedFile.value);

    console.log('Upload successful:', result.message);
    console.log('Summary:', result.data.summary);

    //** Force reload expenses after upload to ensure UI refreshes
    await fetchExpenses(true);

    //** Reset upload state
    showUploadDialog.value = false;
    selectedFile.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    console.error('Upload failed:', error);
    //** TODO: Show user-friendly error message
  } finally {
    isUploading.value = false;
  }
}
</script>
