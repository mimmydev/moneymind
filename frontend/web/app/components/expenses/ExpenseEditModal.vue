<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogDescription>Make changes to your expense details.</DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="grid gap-4 py-4" v-if="expense">
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="date">Date</Label>
            <Input id="date" type="date" v-model="formData.date" required />
          </div>
          <div class="grid gap-2">
            <Label for="amount">Amount (RM)</Label>
            <Input id="amount" type="number" step="0.01" v-model="amountForDisplay" required />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="description">Description</Label>
          <Input id="description" v-model="formData.description" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="merchant">Merchant</Label>
            <Input id="merchant" v-model="formData.merchant" required />
          </div>
          <div class="grid gap-2">
            <Label for="category">Category</Label>
            <select
              id="category"
              v-model="formData.category"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="Food & Dining">Food & Dining</option>
              <option value="Transportation">Transportation</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills & Utilities">Bills & Utilities</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="paymentMethod">Payment Method</Label>
            <select
              id="paymentMethod"
              v-model="formData.paymentMethod"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="E-Wallet">E-Wallet</option>
            </select>
          </div>
          <div class="grid gap-2">
            <Label for="location">Location (Optional)</Label>
            <Input id="location" v-model="formData.location" />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="$emit('update:open', false)">
            Cancel
          </Button>
          <Button type="submit" :disabled="props.isSaving">
            <Loader2 v-if="props.isSaving" class="mr-2 h-4 w-4 animate-spin" />
            {{ props.isSaving ? 'Saving...' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';

interface Expense {
  id: string;
  description: string;
  description_lowercase: string;
  userId: string;
  amount: number;
  amountMYR: string;
  category: string;
  date: string;
  merchant: string;
  paymentMethod: string;
  confidence: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  open: boolean;
  expense: Expense | null;
  isSaving?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [expense: Expense];
}>();

const formData = ref({
  date: '',
  amount: 0,
  description: '',
  merchant: '',
  category: '',
  paymentMethod: '',
  location: '',
});

//** Computed property for amount display with proper decimal formatting
const amountForDisplay = computed({
  get: () => formData.value.amount.toFixed(2),
  set: (value: string) => {
    const numericValue = parseFloat(value) || 0;
    formData.value.amount = numericValue;
  },
});

//** Watch for expense changes to populate form
watch(
  () => props.expense,
  (expense) => {
    if (expense) {
      // Handle invalid or missing dates
      let formattedDate = '';
      if (expense.date && expense.date !== 'null' && expense.date !== 'undefined') {
        // If date contains 'T', extract the date part; otherwise use as-is
        formattedDate = expense.date.includes('T') ? expense.date.split('T')[0] : expense.date;
      }

      formData.value = {
        date: formattedDate, //** Convert to YYYY-MM-DD format with validation
        amount: expense.amount / 100, //** Convert from cents to RM
        description: expense.description,
        merchant: expense.merchant,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        location: expense.location || '',
      };
    }
  },
  { immediate: true }
);

async function handleSubmit() {
  if (!props.expense) return;

  const updatedExpense: Expense = {
    ...props.expense,
    date: formData.value.date,
    amount: Math.round(formData.value.amount * 100), //** Convert to cents
    amountMYR: `RM ${formData.value.amount.toFixed(2)}`,
    description: formData.value.description,
    merchant: formData.value.merchant,
    category: formData.value.category,
    paymentMethod: formData.value.paymentMethod,
    location: formData.value.location || undefined,
    updatedAt: new Date().toISOString(),
  };

  //** Emit the save event - let the parent composable handle the API call
  emit('save', updatedExpense);
}
</script>
