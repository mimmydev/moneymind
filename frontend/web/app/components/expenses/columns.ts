import type { ColumnDef } from '@tanstack/vue-table';
import { h } from 'vue';
import { ArrowUpDown, Eye, Edit, Trash2 } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import type { Expense } from '@/services/expenses';

//** Define proper types for table meta
interface TableMeta {
  onViewExpense?: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expense: Expense) => void;
}

export const columns: ColumnDef<Expense>[] = [
  {
    accessorKey: 'date',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'h-8 px-2 lg:px-3',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Date', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return h(
        'div',
        { class: 'font-medium text-sm' },
        date.toLocaleDateString('en-MY', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'h-8 px-2 lg:px-3',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Description', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return h(
        'div',
        {
          class: 'max-w-[200px] truncate font-medium text-sm',
          title: description,
        },
        description
      );
    },
  },
  {
    accessorKey: 'merchant',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'h-8 px-2 lg:px-3',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Merchant', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const merchant = row.getValue('merchant') as string;
      return h(
        'div',
        {
          class: 'max-w-[150px] truncate text-sm text-muted-foreground',
          title: merchant,
        },
        merchant
      );
    },
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return h('div', { class: 'text-left' }, 'Category');
    },
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      const categoryColors: Record<string, string> = {
        food_restaurant:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
        food_mamak:
          'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
        transportation:
          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        shopping:
          'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
        entertainment:
          'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
        education:
          'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
        other_miscellaneous:
          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
      };

      //** Handle undefined or null category values
      const safeCategory = category || 'other_miscellaneous';
      const displayName = safeCategory.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      return h(
        Badge,
        {
          variant: 'outline',
          class: `text-xs ${categoryColors[safeCategory] || categoryColors['other_miscellaneous']}`,
        },
        () => displayName
      );
    },
  },
  {
    accessorKey: 'amountMYR',
    header: ({ column }) => {
      return h(
        Button,
        {
          variant: 'ghost',
          class: 'h-8 px-2 lg:px-3 justify-end',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Amount', h(ArrowUpDown, { class: 'ml-2 h-4 w-4' })]
      );
    },
    cell: ({ row }) => {
      const amount = row.getValue('amountMYR') as string;
      return h('div', { class: 'text-right font-medium text-sm' }, amount);
    },
  },
  {
    accessorKey: 'paymentMethod',
    header: ({ column }) => {
      return h('div', { class: 'text-left' }, 'Payment');
    },
    cell: ({ row }) => {
      const paymentMethod = row.getValue('paymentMethod') as string;
      const methodColors: Record<string, string> = {
        card: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        cash: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
      };

      const displayName = paymentMethod === 'card' ? 'Card' : 'Cash';

      return h(
        Badge,
        {
          variant: 'outline',
          class: `text-xs ${methodColors[paymentMethod] || 'bg-gray-50 text-gray-700 border-gray-200'}`,
        },
        () => displayName
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const expense = row.original;
      const meta = table.options.meta as TableMeta;

      return h('div', { class: 'flex items-center justify-end space-x-1' }, [
        //** View button
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'h-8 w-8 p-0 hover:bg-muted',
            onClick: (e: Event) => {
              e.stopPropagation();
              if (meta?.onViewExpense) {
                meta.onViewExpense(expense);
              }
            },
            title: 'View details',
          },
          () => h(Eye, { class: 'h-4 w-4' })
        ),
        //** Edit button
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'h-8 w-8 p-0 hover:bg-muted',
            onClick: (e: Event) => {
              e.stopPropagation();
              if (meta?.onEditExpense) {
                meta.onEditExpense(expense);
              }
            },
            title: 'Edit expense',
          },
          () => h(Edit, { class: 'h-4 w-4' })
        ),
        //** Delete button
        h(
          Button,
          {
            variant: 'ghost',
            size: 'sm',
            class: 'h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive',
            onClick: (e: Event) => {
              e.stopPropagation();
              if (meta?.onDeleteExpense) {
                meta.onDeleteExpense(expense);
              }
            },
            title: 'Delete expense',
          },
          () => h(Trash2, { class: 'h-4 w-4' })
        ),
      ]);
    },
  },
];
