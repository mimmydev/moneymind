<template>
  <AlertDialog :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete this expense? This action cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div v-if="expense" class="py-4">
        <div class="rounded-md bg-muted p-4">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-medium">{{ expense.description }}</h4>
            <span class="font-semibold text-destructive">{{ expense.amountMYR }}</span>
          </div>
          <div class="text-sm text-muted-foreground">
            <p>{{ expense.merchant }} • {{ formatDate(expense.date) }}</p>
            <p>{{ expense.category }} • {{ expense.paymentMethod }}</p>
          </div>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="$emit('update:open', false)">Cancel</AlertDialogCancel>
        <AlertDialogAction
          @click="handleDelete"
          :disabled="isDeleting"
          class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <Loader2 v-if="isDeleting" class="mr-2 h-4 w-4 animate-spin" />
          {{ isDeleting ? 'Deleting...' : 'Delete' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';

interface Expense {
  id: string;
  description: string;
  amount: number;
  amountMYR: string;
  category: string;
  date: string;
  merchant: string;
  paymentMethod: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  expense: Expense | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  delete: [expense: Expense];
}>();

const isDeleting = ref(false);

async function handleDelete() {
  if (!props.expense) return;

  try {
    isDeleting.value = true;

    //** Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    emit('delete', props.expense);
    emit('update:open', false);
  } catch (error) {
    console.error('Failed to delete expense:', error);
  } finally {
    isDeleting.value = false;
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
</script>
