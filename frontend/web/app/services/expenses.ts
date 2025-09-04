import apiClient from './api/index';

export interface Expense {
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

interface Pagination {
  hasMore: boolean;
  lastEvaluatedKey: string;
  limit: number;
  count: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    expenses: Expense[];
    pagination: Pagination;
  };
  message: string;
}

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await apiClient.get<ApiResponse>('/expenses');
  return response.data.data.expenses;
};

export const getExpensesByPeriod = async (
  period: string = '30d',
  userId: string = 'demo-user-malaysia'
): Promise<Expense[]> => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  try {
    const response = await apiClient.get<ApiResponse>(
      `/expenses?startDate(string)=${startDateStr}&endDate(string)=${endDateStr}&userId=${userId}`
    );
    return response.data.data.expenses;
  } catch (error) {
    console.warn(`Failed to fetch expenses for period ${period}, falling back to all expenses`);

    return getExpenses();
  }
};

interface UploadResponse {
  success: boolean;
  data: {
    successful: Expense[];
    failed: any[];
    csvProcessing?: {
      totalRows: number;
      validExpenses: number;
      duplicatesSkipped: number;
    };
    summary: {
      totalProcessed: number;
      successful: number;
      failed: number;
      totalAmount: number;
      totalAmountMYR: string;
    };
  };
  message: string;
}

export const uploadExpenses = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  //** Determine endpoint based on file type
  const endpoint = file.name.endsWith('.csv') ? '/expenses/csv' : '/expenses/bulk';

  const response = await apiClient.post<UploadResponse>(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface UpdateResponse {
  success: boolean;
  data: {
    expense: Expense;
  };
  message: string;
}

export const updateExpense = async (
  id: string,
  originalDate: string,
  updatedExpense: Partial<Expense>
): Promise<Expense> => {
  //** Handle null, undefined, or empty dates
  if (!originalDate || originalDate === 'null' || originalDate === 'undefined') {
    throw new Error('Original date is required for expense update');
  }

  //** Format date to YYYY-MM-DD if it's not already in that format
  let formattedDate = originalDate;
  if (originalDate.includes('T')) {
    //** If it's an ISO string, extract just the date part
    const datePart = originalDate.split('T')[0];
    if (datePart) {
      formattedDate = datePart;
    }
  } else if (!originalDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    //** If it's not in YYYY-MM-DD format, try to parse and format it
    const dateObj = new Date(originalDate);
    if (!isNaN(dateObj.getTime())) {
      const isoDatePart = dateObj.toISOString().split('T')[0];
      if (isoDatePart) {
        formattedDate = isoDatePart;
      }
    }
  }

  //** Prepare the update payload (amount is already in cents from the modal)
  const updatePayload: any = { ...updatedExpense };

  //** Remove fields that shouldn't be sent in the update request
  delete updatePayload.id;
  delete updatePayload.createdAt;
  delete updatePayload.updatedAt;
  delete updatePayload.userId;
  delete updatePayload.description_lowercase;
  delete updatePayload.confidence;
  delete updatePayload.amountMYR; //** This will be calculated by the backend

  const response = await apiClient.put<UpdateResponse>(
    `/expenses/${id}?date=${formattedDate}`,
    updatePayload
  );
  return response.data.data.expense;
};

export const deleteExpense = async (id: string, date: string): Promise<DeleteResponse> => {
  //** Handle null, undefined, or empty dates
  if (!date || date === 'null' || date === 'undefined') {
    throw new Error('Date is required for expense deletion');
  }

  //** Format date to YYYY-MM-DD if it's not already in that format
  let formattedDate = date;
  if (date.includes('T')) {
    //** If it's an ISO string, extract just the date part
    const datePart = date.split('T')[0];
    if (datePart) {
      formattedDate = datePart;
    }
  } else if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    //** If it's not in YYYY-MM-DD format, try to parse and format it
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      const isoDatePart = dateObj.toISOString().split('T')[0];
      if (isoDatePart) {
        formattedDate = isoDatePart;
      }
    }
  }

  const response = await apiClient.delete<DeleteResponse>(`/expenses/${id}?date=${formattedDate}`);
  return response.data;
};
