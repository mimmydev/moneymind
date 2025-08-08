//** DynamoDB Expenses CRUD operations

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { expenseRepository } from '../service/expense-repository';
import {
  CreateExpenseRequest,
  UpdateExpenseRequest,
  BulkCreateExpensesRequest,
  APIResponse,
} from '../types';
import { parseCSVToExpenses } from '../helper/expenses';

// ========================================
//** UTILITY FUNCTIONS
// ========================================

/**
 * Create API response with proper headers
 * Frontend developers will recognize this pattern from axios responses
 */
const createResponse = (statusCode: number, body: APIResponse): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body, null, 2),
});

/**
 * Extract user ID from request
 * In production, this would come from JWT token validation
 * For MVP, we'll use a query parameter or default demo user
 */
const getUserId = (event: APIGatewayProxyEvent): string => {
  //** For demo purposes, use query parameter or default user
  //** In production: extract from validated JWT token
  return event.queryStringParameters?.userId || 'demo-user-malaysia';
};

/**
 * Parse and validate JSON body
 */
const parseBody = <T>(event: APIGatewayProxyEvent): T => {
  if (!event.body) {
    throw new Error('Request body is required');
  }

  try {
    return JSON.parse(event.body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
};

// ========================================
//** EXPENSE HANDLERS
// ========================================

/**
 * GET /api/expenses
 * Get user's expenses with filtering and pagination
 */
export const getExpenses = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const queryParams = event.queryStringParameters || {};

    //** Extract filter parameters
    const startDate = queryParams.startDate;
    const endDate = queryParams.endDate;
    const category = queryParams.category as any; //** Will be validated by repository
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 20;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey;

    //** Validate date format if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return createResponse(400, {
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD',
      });
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return createResponse(400, {
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD',
      });
    }

    //** Query expenses using repository
    const result = await expenseRepository.getExpenses({
      userId,
      startDate,
      endDate,
      category,
      limit,
      lastEvaluatedKey,
    });

    return createResponse(200, {
      success: true,
      data: {
        expenses: result.items,
        pagination: {
          hasMore: result.hasMore,
          lastEvaluatedKey: result.lastEvaluatedKey,
          limit,
          count: result.items.length,
        },
      },
      message: `Found ${result.items.length} expenses`,
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get expenses',
    });
  }
};

/**
 * GET /api/expenses/{id}
 * Get a single expense by ID
 */
export const getExpense = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const expenseId = event.pathParameters?.id;
    const date = event.queryStringParameters?.date;

    if (!expenseId) {
      return createResponse(400, {
        success: false,
        error: 'Expense ID is required',
      });
    }

    if (!date) {
      return createResponse(400, {
        success: false,
        error: 'Date query parameter is required (YYYY-MM-DD format)',
      });
    }

    const expense = await expenseRepository.getExpenseById(userId, expenseId, date);

    if (!expense) {
      return createResponse(404, {
        success: false,
        error: 'Expense not found',
      });
    }

    return createResponse(200, {
      success: true,
      data: { expense },
      message: 'Expense retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting expense:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get expense',
    });
  }
};

/**
 * POST /api/expenses
 * Create a new expense
 */
export const createExpense = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const expenseData = parseBody<CreateExpenseRequest>(event);

    //** Validate required fields
    if (!expenseData.description || expenseData.description.trim() === '') {
      return createResponse(400, {
        success: false,
        error: 'Description is required',
      });
    }

    if (!expenseData.amount || expenseData.amount <= 0) {
      return createResponse(400, {
        success: false,
        error: 'Amount must be greater than 0',
      });
    }

    //** Validate amount is in cents (no decimals allowed)
    if (!Number.isInteger(expenseData.amount)) {
      return createResponse(400, {
        success: false,
        error: 'Amount must be in cents (integer value). For RM 10.50, send 1050',
      });
    }

    //** Create expense using repository
    const expense = await expenseRepository.createExpense(userId, expenseData);

    return createResponse(201, {
      success: true,
      data: { expense },
      message: `Expense created successfully: ${expense.amountMYR} for ${expense.description}`,
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create expense',
    });
  }
};

/**
 * PUT /api/expenses/{id}
 * Update an existing expense
 */
export const updateExpense = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const expenseId = event.pathParameters?.id;
    const date = event.queryStringParameters?.date;
    const updateData = parseBody<UpdateExpenseRequest>(event);

    if (!expenseId) {
      return createResponse(400, {
        success: false,
        error: 'Expense ID is required',
      });
    }

    if (!date) {
      return createResponse(400, {
        success: false,
        error: 'Date query parameter is required (YYYY-MM-DD format)',
      });
    }

    //** Validate amount if provided
    if (updateData.amount !== undefined) {
      if (updateData.amount <= 0) {
        return createResponse(400, {
          success: false,
          error: 'Amount must be greater than 0',
        });
      }

      if (!Number.isInteger(updateData.amount)) {
        return createResponse(400, {
          success: false,
          error: 'Amount must be in cents (integer value)',
        });
      }
    }

    //** Update expense using repository
    const expense = await expenseRepository.updateExpense(userId, expenseId, date, updateData);

    if (!expense) {
      return createResponse(404, {
        success: false,
        error: 'Expense not found',
      });
    }

    return createResponse(200, {
      success: true,
      data: { expense },
      message: 'Expense updated successfully',
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update expense',
    });
  }
};

/**
 * DELETE /api/expenses/{id}
 * Delete an expense
 */
export const destroyExpense = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    //** Extract parameters
    const userId = getUserId(event);
    const expenseId = event.pathParameters?.id;
    const date = event.queryStringParameters?.date;

    console.log('Delete request parameters:', { userId, expenseId, date });

    //** Basic validation
    if (!expenseId) {
      console.log('❌ Missing expense ID');
      return createResponse(400, {
        success: false,
        error: 'Expense ID is required',
      });
    }

    if (!date) {
      console.log('❌ Missing date parameter');
      return createResponse(400, {
        success: false,
        error: 'Date query parameter is required (YYYY-MM-DD format)',
      });
    }

    await expenseRepository.deleteExpense(userId, expenseId, date);

    return createResponse(200, {
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    console.error('💥 Error in delete handler:', error);

    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete expense',
    });
  }
};

/**
 * POST /api/expenses/bulk
 * Bulk create expenses (for CSV uploads)
 */
export const bulkCreateExpenses = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const requestData = parseBody<BulkCreateExpensesRequest>(event);

    if (!requestData.expenses || !Array.isArray(requestData.expenses)) {
      return createResponse(400, {
        success: false,
        error: 'expenses array is required',
      });
    }

    if (requestData.expenses.length === 0) {
      return createResponse(400, {
        success: false,
        error: 'At least one expense is required',
      });
    }

    if (requestData.expenses.length > 100) {
      return createResponse(400, {
        success: false,
        error: 'Maximum 100 expenses per batch. For larger uploads, use multiple requests.',
      });
    }

    //** Validate each expense
    for (let i = 0; i < requestData.expenses.length; i++) {
      const expense = requestData.expenses[i];

      if (!expense.description || expense.description.trim() === '') {
        return createResponse(400, {
          success: false,
          error: `Expense ${i + 1}: Description is required`,
        });
      }

      if (!expense.amount || expense.amount <= 0) {
        return createResponse(400, {
          success: false,
          error: `Expense ${i + 1}: Amount must be greater than 0`,
        });
      }

      if (!Number.isInteger(expense.amount)) {
        return createResponse(400, {
          success: false,
          error: `Expense ${i + 1}: Amount must be in cents (integer value)`,
        });
      }
    }

    //** Bulk create expenses using repository
    const result = await expenseRepository.bulkCreateExpenses(userId, requestData.expenses);

    const successCount = result.successful.length;
    const failureCount = result.failed.length;
    const totalExpensesAmount = result.successful.reduce((sum, exp) => sum + exp.amount, 0);

    return createResponse(201, {
      success: true,
      data: {
        successful: result.successful,
        failed: result.failed,
        summary: {
          totalProcessed: requestData.expenses.length,
          successful: successCount,
          failed: failureCount,
          totalAmount: totalExpensesAmount,
          totalAmountMYR: `RM ${(totalExpensesAmount / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
        },
      },
      message: `Bulk upload completed: ${successCount} successful, ${failureCount} failed`,
    });
  } catch (error) {
    console.error('Error bulk creating expenses:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk create expenses',
    });
  }
};

/**
 * POST /api/expenses/csv
 * Parse CSV file and create expenses using existing bulk logic
 */

export const uploadCSV = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);

    //** Parse multipart form data (CSV file)
    const csvContent = await parseCSVFromEvent(event);

    if (!csvContent) {
      return createResponse(400, {
        success: false,
        error: 'CSV file is required',
      });
    }

    //** Parse CSV content to expense array
    const expenses = await parseCSVToExpenses(csvContent);

    if (expenses.length === 0) {
      return createResponse(400, {
        success: false,
        error: 'No valid expenses found in CSV file',
      });
    }

    if (expenses.length > 25) {
      return createResponse(400, {
        success: false,
        error: 'Maximum 25 expenses per CSV upload',
      });
    }

    //** 🎯 KEY: Reuse your existing bulkCreateExpenses logic!
    const result = await expenseRepository.bulkCreateExpenses(userId, expenses);

    const successCount = result.successful.length;
    const failureCount = result.failed.length;
    const totalAmount = result.successful.reduce((sum, exp) => sum + exp.amount, 0);

    return createResponse(201, {
      success: true,
      data: {
        successful: result.successful,
        failed: result.failed,
        csvProcessing: {
          totalRows: expenses.length,
          validExpenses: expenses.length,
          duplicatesSkipped: 0, //** TODO: Add duplicate detection
        },
        summary: {
          totalProcessed: expenses.length,
          successful: successCount,
          failed: failureCount,
          totalAmount,
          totalAmountMYR: `RM ${(totalAmount / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`,
        },
      },
      message: `CSV upload completed: ${successCount} successful, ${failureCount} failed from ${expenses.length} rows`,
    });
  } catch (error) {
    console.error('Error processing CSV upload:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process CSV upload',
    });
  }
};

/**
 * Parse CSV file from API Gateway event
 * Handles multipart/form-data or base64 encoded content
 */
async function parseCSVFromEvent(event: APIGatewayProxyEvent): Promise<string | null> {
  if (!event.body) {
    return null;
  }

  //** Handle base64 encoded body (API Gateway often base64 encodes binary data)
  let csvContent: string;

  if (event.isBase64Encoded) {
    csvContent = Buffer.from(event.body, 'base64').toString('utf-8');
  } else {
    csvContent = event.body;
  }

  //** For MVP, we'll accept raw CSV content
  //** In production, you'd want proper multipart/form-data parsing
  return csvContent;
}

/**
 * GET /api/expenses/search?q=searchTerm
 * Search expenses by description
 */
export const searchExpenses = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = getUserId(event);
    const searchTerm = event.queryStringParameters?.q;

    if (!searchTerm || searchTerm.trim().length < 2) {
      return createResponse(400, {
        success: false,
        error: 'Search term must be at least 2 characters',
      });
    }

    //** Search expenses using repository
    const expenses = await expenseRepository.searchExpensesByDescription(userId, searchTerm.trim());

    return createResponse(200, {
      success: true,
      data: {
        expenses,
        searchTerm,
        count: expenses.length,
      },
      message: `Found ${expenses.length} expenses matching "${searchTerm}"`,
    });
  } catch (error) {
    console.error('Error searching expenses:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search expenses',
    });
  }
};
