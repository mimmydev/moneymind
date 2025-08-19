<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Open menu</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem @click="viewExpense">
        <Eye class="mr-2 h-4 w-4" />
        View details
      </DropdownMenuItem>
      <DropdownMenuItem @click="editExpense">
        <Edit class="mr-2 h-4 w-4" />
        Edit expense
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="deleteExpense" class="text-red-600">
        <Trash2 class="mr-2 h-4 w-4" />
        Delete expense
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import type { Expense } from '@/app/services/expenses';

interface Props {
  expense: Expense;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  view: [expense: Expense];
  edit: [expense: Expense];
  delete: [expense: Expense];
}>();

function viewExpense() {
  emit('view', props.expense);
}

function editExpense() {
  emit('edit', props.expense);
}

function deleteExpense() {
  emit('delete', props.expense);
}
</script>
