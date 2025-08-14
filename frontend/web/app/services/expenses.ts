import apiClient from "./api/index";

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