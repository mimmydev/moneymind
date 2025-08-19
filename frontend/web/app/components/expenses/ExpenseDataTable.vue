<template>
  <div class="w-full space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Input
          placeholder="Search expenses by description, merchant, or category..."
          :model-value="globalFilter"
          @update:model-value="setGlobalFilter"
          class="h-8 w-[250px] lg:w-[300px]"
        />
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="$emit('upload')" size="sm">
          <Upload class="mr-2 h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>

    <div class="rounded-md border bg-background">
      <Table>
        <TableCaption class="text-left p-4 text-sm text-muted-foreground">
          A list of your recent expenses. Total: {{ data.length }} expense(s)
        </TableCaption>
        <TableHeader>
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="hover:bg-transparent"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="getHeaderClass(header.id)"
            >
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              @click="$emit('rowClick', row.original)"
              class="cursor-pointer transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="getCellClass(cell.column.id)"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow class="hover:bg-transparent">
              <TableCell :colspan="columns.length" class="h-32 text-center">
                <div v-if="isLoading" class="flex flex-col items-center justify-center space-y-2">
                  <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
                  <p class="text-sm text-muted-foreground">Loading expenses...</p>
                </div>
                <div v-else class="flex flex-col items-center justify-center space-y-2">
                  <div class="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload class="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div class="text-center">
                    <p class="text-sm font-medium">No expenses found</p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{
                        globalFilter
                          ? 'Try adjusting your search terms'
                          : 'Upload your first expense to get started'
                      }}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex-1 text-sm text-muted-foreground">
        Showing {{ table.getRowModel().rows.length }} of {{ data.length }} expense(s)
        {{ globalFilter ? `(filtered from ${data.length} total)` : '' }}
      </div>
      <div class="flex items-center space-x-6 lg:space-x-8">
        <div class="flex items-center space-x-2">
          <p class="text-sm font-medium">Rows per page</p>
          <select
            :value="table.getState().pagination.pageSize"
            @change="table.setPageSize(Number(($event.target as HTMLSelectElement).value))"
            class="h-8 w-[70px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
            <option value="50">50</option>
          </select>
        </div>
        <div class="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {{ table.getState().pagination.pageIndex + 1 }} of {{ table.getPageCount() }}
        </div>
        <div class="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.setPageIndex(0)"
            class="hidden h-8 w-8 p-0 lg:flex"
          >
            <span class="sr-only">Go to first page</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
            class="h-8 w-8 p-0"
          >
            <span class="sr-only">Go to previous page</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
            class="h-8 w-8 p-0"
          >
            <span class="sr-only">Go to next page</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.setPageIndex(table.getPageCount() - 1)"
            class="hidden h-8 w-8 p-0 lg:flex"
          >
            <span class="sr-only">Go to last page</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/vue-table';
import { Upload, Loader2 } from 'lucide-vue-next';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import type { Expense } from '@/app/services/expenses';

interface Props {
  columns: ColumnDef<Expense>[];
  data: Expense[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  upload: [];
  rowClick: [expense: Expense];
  deleteExpense: [expense: Expense];
}>();

//** Table state
const sorting = ref<SortingState>([]);
const columnFilters = ref<ColumnFiltersState>([]);
const globalFilter = ref('');

//** Utility function for updating reactive state
function valueUpdater<T>(updaterOrValue: T | ((old: T) => T), ref: { value: T }) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? (updaterOrValue as (old: T) => T)(ref.value)
      : updaterOrValue;
}

//** Header class helper
function getHeaderClass(headerId: string): string {
  const baseClasses = 'h-12 px-4';

  switch (headerId) {
    case 'date':
      return `${baseClasses} w-[120px]`;
    case 'description':
      return `${baseClasses} min-w-[200px]`;
    case 'merchant':
      return `${baseClasses} w-[150px]`;
    case 'category':
      return `${baseClasses} w-[140px]`;
    case 'amountMYR':
      return `${baseClasses} w-[120px] text-right`;
    case 'paymentMethod':
      return `${baseClasses} w-[130px]`;
    case 'actions':
      return `${baseClasses} w-[120px]`;
    default:
      return baseClasses;
  }
}

//** Cell class helper
function getCellClass(columnId: string): string {
  const baseClasses = 'px-4 py-3';

  switch (columnId) {
    case 'date':
      return `${baseClasses} font-medium`;
    case 'description':
      return `${baseClasses} max-w-[200px]`;
    case 'merchant':
      return `${baseClasses} max-w-[150px]`;
    case 'category':
      return baseClasses;
    case 'amountMYR':
      return `${baseClasses} text-right font-medium`;
    case 'paymentMethod':
      return baseClasses;
    case 'actions':
      return `${baseClasses} text-right`;
    default:
      return baseClasses;
  }
}

//** Create table instance
const table = useVueTable({
  get data() {
    return props.data;
  },
  get columns() {
    return props.columns;
  },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnFilters),
  onGlobalFilterChange: (updaterOrValue) => valueUpdater(updaterOrValue, globalFilter),
  initialState: {
    pagination: {
      pageSize: 10,
    },
  },
  meta: {
    onViewExpense: (expense: Expense) => emit('rowClick', expense),
    onEditExpense: (expense: Expense) => emit('rowClick', expense),
    onDeleteExpense: (expense: Expense) => emit('deleteExpense', expense),
  },
  state: {
    get sorting() {
      return sorting.value;
    },
    get columnFilters() {
      return columnFilters.value;
    },
    get globalFilter() {
      return globalFilter.value;
    },
  },
});

//** Global filter setter
function setGlobalFilter(value: string) {
  globalFilter.value = value;
}
</script>
