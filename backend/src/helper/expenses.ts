import { expenseRepository } from '../service/expense-repository';
import { CreateExpenseRequest } from '../types';
import csv from 'csv-parser';
import { Readable } from 'stream';

/**
 * Helper function to populate demo data for Malaysian users
 * You can call this during development to test your app
 */
export const createMalaysianDemoData = async (userId: string) => {
  const demoExpenses: CreateExpenseRequest[] = [
    {
      description: 'Nasi Kandar Pelita',
      amount: 1250, //** RM 12.50
      category: 'food_mamak' as any,
      date: '2024-08-07',
      merchant: 'Pelita Nasi Kandar',
      paymentMethod: 'cash' as any,
    },
    {
      description: 'Grab ride to KLCC',
      amount: 1800, //** RM 18.00
      category: 'transport_grab' as any,
      date: '2024-08-07',
      merchant: 'Grab',
      paymentMethod: 'grabpay' as any,
    },
    {
      description: 'Starbucks Venti Latte',
      amount: 1650, //** RM 16.50
      category: 'food_coffee' as any,
      date: '2024-08-06',
      merchant: 'Starbucks',
      paymentMethod: 'credit_card' as any,
    },
    {
      description: 'Petronas RON95',
      amount: 4500, //** RM 45.00
      category: 'transport_fuel' as any,
      date: '2024-08-06',
      merchant: 'Petronas',
      paymentMethod: 'debit_card' as any,
    },
    {
      description: 'AEON grocery shopping',
      amount: 8750, //** RM 87.50
      category: 'food_groceries' as any,
      date: '2024-08-05',
      merchant: 'AEON Big',
      paymentMethod: 'credit_card' as any,
    },
  ];

  return await expenseRepository.bulkCreateExpenses(userId, demoExpenses);
};

/**
 * Parse CSV content to CreateExpenseRequest array
 * Supports Malaysian bank CSV formats
 */
export async function parseCSVToExpenses(csvContent: string): Promise<CreateExpenseRequest[]> {
  return new Promise((resolve, reject) => {
    const expenses: CreateExpenseRequest[] = [];
    const errors: string[] = [];

    const stream = Readable.from([csvContent]);

    stream
      .pipe(
        csv({
          //** Handle common Malaysian bank CSV formats
          headers: ['date', 'description', 'amount', 'merchant', 'category'],
        })
      )
      .on('data', (row: any) => {
        try {
          if (!row || Object.values(row).every((val) => !val || val.toString().trim() === '')) {
            return;
          }

          const expense = parseCSVRow(row);
          if (expense) {
            expenses.push(expense);
          }
        } catch (error) {
          //** Handle errors gracefully
          errors.push(`Row error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      })
      .on('end', () => {
        console.log(
          `CSV parsing completed: ${expenses.length} valid expenses, ${errors.length} errors`
        );
        if (errors.length > 0) {
          console.log('CSV parsing errors:', errors);
        }
        resolve(expenses);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Parse individual CSV row to CreateExpenseRequest
 * Handles Malaysian currency and date formats
 */
export function parseCSVRow(row: any): CreateExpenseRequest | null {
  //** Skip header row or empty rows
  if (!row.date || !row.description || !row.amount) {
    return null;
  }

  //** Skip if this looks like a header row
  if (row.date.toLowerCase() === 'date' || row.description.toLowerCase() === 'description') {
    return null;
  }

  try {
    //** Parse date (support multiple formats)
    const date = parseDate(row.date);

    //** Parse amount (handle Malaysian formats)
    const amount = parseAmount(row.amount);

    //** Clean description
    const description = row.description.trim();

    if (!description || amount <= 0) {
      return null;
    }

    return {
      description,
      amount,
      date,
      merchant: row.merchant?.trim() || undefined,
      category: (row.category?.trim() as any) || undefined, //** Let auto-categorization handle it
      paymentMethod: 'card' as any, //** Default for CSV imports
    };
  } catch (error) {
    console.error('Error parsing CSV row:', row, error);
    return null;
  }
}

/**
 * Parse date from various Malaysian bank formats
 */
export function parseDate(dateStr: string): string {
  //** Remove any extra whitespace
  const cleaned = dateStr.trim();

  //** Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  //** DD/MM/YYYY format (common in Malaysian banks)
  const ddmmyyMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyMatch) {
    const [, day, month, year] = ddmmyyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  //** DD-MM-YYYY format
  const ddmmyyDashMatch = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyDashMatch) {
    const [, day, month, year] = ddmmyyDashMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  //** Fallback: try to parse and format
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  //** Default to today if unparseable
  return new Date().toISOString().split('T')[0];
}

/**
 * Parse amount from Malaysian currency formats
 * Converts to cents (integer)
 */
export function parseAmount(amountStr: string): number {
  //** Remove any currency symbols and whitespace
  let cleaned = amountStr.toString().trim();

  //** Remove Malaysian currency symbols
  cleaned = cleaned.replace(/RM\s*/gi, '');
  cleaned = cleaned.replace(/MYR\s*/gi, '');

  //** Remove commas (thousand separators)
  cleaned = cleaned.replace(/,/g, '');

  //** Handle negative amounts (expenses should be positive)
  const isNegative = cleaned.includes('-');
  cleaned = cleaned.replace(/-/g, '');

  //** Parse as float
  const amount = parseFloat(cleaned);

  if (isNaN(amount) || amount < 0) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  //** Convert to cents (multiply by 100)
  const amountInCents = Math.round(amount * 100);

  return amountInCents;
}
