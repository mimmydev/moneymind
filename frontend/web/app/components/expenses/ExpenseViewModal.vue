<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogDescription> View detailed information about this expense. </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4" v-if="expense">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Date</label>
            <p class="text-sm">{{ formatDate(expense.date) }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Amount</label>
            <p class="text-sm font-semibold">{{ expense.amountMYR }}</p>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium text-muted-foreground">Description</label>
          <p class="text-sm">{{ expense.description }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Merchant</label>
            <p class="text-sm">{{ expense.merchant }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Category</label>
            <p class="text-sm">{{ expense.category }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Payment Method</label>
            <p class="text-sm">{{ expense.paymentMethod }}</p>
          </div>
          <div v-if="expense.location">
            <label class="text-sm font-medium text-muted-foreground">Location</label>
            <p class="text-sm">{{ expense.location }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <label class="font-medium">Created</label>
            <p>{{ formatDateTime(expense.createdAt) }}</p>
          </div>
          <div>
            <label class="font-medium">Updated</label>
            <p>{{ formatDateTime(expense.updatedAt) }}</p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">Close</Button>
        <Button @click="$emit('edit', expense)">Edit</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
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

defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  edit: [expense: Expense];
}>();

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
</script>
