// ========================================
//** CORE DATA TYPES
// ========================================

export interface Expense {
  id: string
  userId: string
  description: string
  amount: number              //** Always in MYR cents (e.g., RM 10.50 = 1050)
  amountMYR: string          //** Display format: "RM 10.50"
  category: MalaysianCategory
  date: string               //** ISO date: "YYYY-MM-DD"
  createdAt: string          //** ISO timestamp
  updatedAt?: string
  merchant?: string
  location?: string
  notes?: string
  confidence?: number        //** 0-100 for auto-categorization confidence
  
  //** Malaysian-specific fields
  paymentMethod?: MalaysianPaymentMethod
  isGSTIncluded?: boolean    //** For business expense tracking
  gstAmount?: number         //** GST amount in cents if applicable
}

export interface User {
  id: string
  email: string
  name: string
  
  //** Malaysian-specific preferences
  monthlyBudget: number      //** In MYR cents
  budgetStartDate: number    //** Day of month (1-31) when budget resets
  defaultCategories: MalaysianCategory[]
  timezone: 'Asia/Kuala_Lumpur'
  
  //** Profile timestamps
  createdAt: string
  lastActiveAt: string
}

// ========================================
//** MADANI-SPENDER-SPECIFIC ENUMS
// ========================================

export enum MalaysianCategory {
  //** Food & Dining
  FOOD_MAMAK = 'food_mamak',           //** Mamak stalls
  FOOD_RESTAURANT = 'food_restaurant',  //** Restaurants
  FOOD_FOOD_COURT = 'food_food_court', //** Food courts/hawker centers
  FOOD_DELIVERY = 'food_delivery',     //** GrabFood, FoodPanda
  FOOD_GROCERIES = 'food_groceries',   //** Tesco, AEON, Giant
  FOOD_COFFEE = 'food_coffee',         //** Starbucks, Old Town, Kopitiam
  
  //** Transportation
  TRANSPORT_GRAB = 'transport_grab',         //** Grab rides
  TRANSPORT_FUEL = 'transport_fuel',         //** Petrol/Diesel
  TRANSPORT_PARKING = 'transport_parking',   //** Parking fees
  TRANSPORT_TOLL = 'transport_toll',         //** Highway tolls
  TRANSPORT_PUBLIC = 'transport_public',     //** LRT, MRT, Bus
  TRANSPORT_MAINTENANCE = 'transport_maintenance', //** Car servicing
  
  //** Shopping
  SHOPPING_CLOTHING = 'shopping_clothing',   //** Fashion
  SHOPPING_ELECTRONICS = 'shopping_electronics', //** Electronics
  SHOPPING_ONLINE = 'shopping_online',       //** Shopee, Lazada
  SHOPPING_PHARMACY = 'shopping_pharmacy',   //** Guardian, Watsons
  
  //** Bills & Utilities
  BILLS_ELECTRICITY = 'bills_electricity',  //** TNB
  BILLS_WATER = 'bills_water',             //** Water bills
  BILLS_INTERNET = 'bills_internet',       //** Unifi, Maxis, etc.
  BILLS_MOBILE = 'bills_mobile',           //** Mobile phone bills
  BILLS_INSURANCE = 'bills_insurance',     //** Insurance premiums
  
  //** Entertainment
  ENTERTAINMENT_MOVIES = 'entertainment_movies',     //** Cinema
  ENTERTAINMENT_STREAMING = 'entertainment_streaming', //** Netflix, etc.
  ENTERTAINMENT_GAMING = 'entertainment_gaming',     //** Mobile games, Steam
  
  //** Health & Medical
  HEALTH_CLINIC = 'health_clinic',         //** Private clinics
  HEALTH_PHARMACY = 'health_pharmacy',     //** Medicine
  HEALTH_WELLNESS = 'health_wellness',     //** Gym, spa
  
  //** Others
  OTHER_CASH_WITHDRAWAL = 'other_cash_withdrawal', //** ATM withdrawals
  OTHER_TRANSFER = 'other_transfer',       //** Money transfers
  OTHER_MISCELLANEOUS = 'other_miscellaneous'
}

export enum MalaysianPaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  
  //** Malaysian e-wallets
  GRABPAY = 'grabpay',
  TOUCH_N_GO = 'touch_n_go',
  BOOST = 'boost',
  SHOPEE_PAY = 'shopee_pay',
  MAE = 'mae',                    //** Maybank e-wallet
  
  //** Online banking
  MAYBANK = 'maybank',
  CIMB = 'cimb',
  PUBLIC_BANK = 'public_bank',
  RHB = 'rhb',
  HONG_LEONG = 'hong_leong',
  
  //** Others
  BANK_TRANSFER = 'bank_transfer',
  QR_PAY = 'qr_pay'              //** Generic QR payments
}

// ========================================
//** DATABASE MODELS (DynamoDB Items)
// ========================================

//** Base interface for all DynamoDB items
export interface DynamoDBItem {
  PK: string    //** Partition Key
  SK: string    //** Sort Key
  Type: string  //** Item type for filtering
}

//** Expense item in DynamoDB
export interface ExpenseItem extends DynamoDBItem, Expense {
  PK: string    //** Format: "USER#{userId}"
  SK: string    //** Format: "EXPENSE#{date}#{expenseId}"
  Type: 'EXPENSE'
  
  //** GSI fields for category-based queries
  GSI1PK: string  //** Format: "USER#{userId}#CATEGORY#{category}"
  GSI1SK: string  //** Format: "{date}#{expenseId}"

  //** Search optimization fields
  description_lowercase: string  //** Lowercase version for case-insensitive search
}

//** User profile item in DynamoDB
export interface UserItem extends DynamoDBItem, User {
  PK: string    //** Format: "USER#{userId}"
  SK: string    //** Format: "PROFILE"
  Type: 'USER_PROFILE'
}

//** Upload tracking for CSV processing
export interface UploadItem extends DynamoDBItem {
  PK: string    //** Format: "USER#{userId}"
  SK: string    //** Format: "UPLOAD#{uploadId}"
  Type: 'UPLOAD'
  
  uploadId: string
  fileName: string
  status: 'processing' | 'completed' | 'failed'
  totalRows: number
  processedRows: number
  errorRows: number
  createdAt: string
  completedAt?: string
  errors?: string[]
}

// ========================================
//** API REQUEST/RESPONSE TYPES
// ========================================

export interface CreateExpenseRequest {
  description: string
  amount: number              //** In MYR cents
  category?: MalaysianCategory //** Optional, will auto-categorize if not provided
  date?: string              //** Optional, defaults to today
  merchant?: string
  location?: string
  notes?: string
  paymentMethod?: MalaysianPaymentMethod
}

export interface UpdateExpenseRequest extends Partial<CreateExpenseRequest> {
  id: string
}

export interface GetExpensesRequest {
  userId: string
  startDate?: string         //** ISO date
  endDate?: string          //** ISO date
  category?: MalaysianCategory
  limit?: number            //** Pagination
  lastEvaluatedKey?: string //** For pagination
}

export interface BulkCreateExpensesRequest {
  expenses: CreateExpenseRequest[]
}

export interface AnalyticsResponse {
  userId: string
  period: string
  
  //** Summary stats
  totalSpent: number         //** In MYR cents
  totalSpentMYR: string     //** Display: "RM 1,234.56"
  transactionCount: number
  avgTransactionAmount: number
  avgTransactionAmountMYR: string
  
  //** Malaysian budget context
  monthlyBudget: number      //** In MYR cents
  monthlyBudgetMYR: string  //** Display format
  budgetRemaining: number    //** In MYR cents
  budgetRemainingMYR: string
  budgetUsagePercentage: number  //** 0-100
  
  //** Category breakdown
  spendingByCategory: CategorySpending[]
  
  //** Time series for charts
  dailySpending: DailySpending[]
  
  //** Malaysian-specific insights
  topMamakSpending?: number
  grabRideCount?: number
  averageMealCost?: number
}

export interface CategorySpending {
  category: MalaysianCategory
  amount: number
  amountMYR: string
  percentage: number
  transactionCount: number
}

export interface DailySpending {
  date: string               //** ISO date
  amount: number            //** In MYR cents
  amountMYR: string
  transactionCount: number
}

// ========================================
//** UTILITY TYPES
// ========================================

export interface PaginationResult<T> {
  items: T[]
  lastEvaluatedKey?: string
  hasMore: boolean
  total?: number
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ========================================
//** MALAYSIAN BUSINESS RULES
// ========================================

export const MALAYSIAN_CONFIG = {
  //** Currency formatting
  CURRENCY_CODE: 'MYR',
  CURRENCY_SYMBOL: 'RM',
  DECIMAL_PLACES: 2,
  
  //** Common spending ranges for auto-categorization (in cents)
  TYPICAL_AMOUNTS: {
    MAMAK_MEAL: { min: 500, max: 2500 },      //** RM 5.00 - RM 25.00
    RESTAURANT_MEAL: { min: 1500, max: 8000 }, //** RM 15.00 - RM 80.00
    GRAB_RIDE: { min: 800, max: 5000 },       //** RM 8.00 - RM 50.00
    COFFEE: { min: 1000, max: 3000 },          //** RM 10.00 - RM 30.00
    PARKING: { min: 100, max: 2000 },         //** RM 1.00 - RM 20.00
  },
  
  //** Common merchants for auto-categorization
  MERCHANT_PATTERNS: {
    MAMAK: ['mamak', 'nasi kandar', 'teh tarik', 'roti canai'],
    GRAB: ['grab', 'grabfood', 'grabcar'],
    STARBUCKS: ['starbucks', 'coffee bean', 'old town'],
    PETROL: ['shell', 'petronas', 'esso', 'caltex', 'bhp'],
    SHOPPING: ['shopee', 'lazada', 'aeon', 'giant', 'tesco'],
  },
  
  //TODO: This not part of MVP but can add it is Malaysian public holidays for expense insights
  PUBLIC_HOLIDAYS: [
    '2024-01-01', //** New Year
    '2024-02-10', //** Chinese New Year
    '2024-04-10', //** Hari Raya Puasa (example)
    '2024-08-31', //** Merdeka Day
    '2024-09-16', //** Malaysia Day
  ]
} as const

export type MalaysianConfigType = typeof MALAYSIAN_CONFIG
