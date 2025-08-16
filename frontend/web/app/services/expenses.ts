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
