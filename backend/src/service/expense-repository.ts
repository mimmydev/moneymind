//** DynamoDB Repository Pattern - AWS SDK v3 Compatible

import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand, 
  BatchWriteCommand 
} from '@aws-sdk/lib-dynamodb'
import { 
  Expense, 
  ExpenseItem, 
  CreateExpenseRequest, 
  UpdateExpenseRequest,
  GetExpensesRequest,
  PaginationResult,
  MalaysianCategory,
  MALAYSIAN_CONFIG
} from '../types'

//** Initialize DynamoDB client (AWS SDK v3)
const client = new DynamoDBClient({
  region: process.env.REGION || 'ap-southeast-1'
})
const dynamodb = DynamoDBDocumentClient.from(client)

const TABLE_NAME = process.env.DYNAMODB_TABLE!

export class ExpenseRepository {
  
  // ========================================
  //** CREATE OPERATIONS
  // ========================================
  
  /**
   * Create a new expense
   * Think of this like calling an API to save data, but it's saving to DynamoDB
   */
  async createExpense(userId: string, expenseData: CreateExpenseRequest): Promise<Expense> {
    const expenseId = this.generateExpenseId()
    const now = new Date().toISOString()
    const date = expenseData.date || new Date().toISOString().split('T')[0]
    
    //** Auto-categorize if category not provided
    const category = expenseData.category || this.autoCategorizeMalaysian(expenseData.description, expenseData.amount)
    
    const expense: ExpenseItem = {
      //** Primary Key Structure
      PK: `USER#${userId}`,
      SK: `EXPENSE#${date}#${expenseId}`,
      Type: 'EXPENSE',
      
      //** GSI for category-based queries
      GSI1PK: `USER#${userId}#CATEGORY#${category}`,
      GSI1SK: `${date}#${expenseId}`,
      
      //** Search optimization fields
      description_lowercase: expenseData.description.toLowerCase(),
      
      //** Expense data
      id: expenseId,
      userId,
      description: expenseData.description,
      amount: expenseData.amount,
      amountMYR: this.formatMYR(expenseData.amount),
      category,
      date,
      merchant: expenseData.merchant,
      location: expenseData.location,
      notes: expenseData.notes,
      paymentMethod: expenseData.paymentMethod,
      confidence: expenseData.category ? 100 : this.getCategorizationConfidence(expenseData.description),
      createdAt: now,
      updatedAt: now
    }
    
    //** Save to DynamoDB (AWS SDK v3)
    await dynamodb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: expense
    }))
    
    //** Return the expense (without DynamoDB-specific fields)
    return this.itemToExpense(expense)
  }
  
  /**
   * Bulk create expenses (for CSV uploads)
   */
  async bulkCreateExpenses(userId: string, expenses: CreateExpenseRequest[]): Promise<{
    successful: Expense[]
    failed: { expense: CreateExpenseRequest; error: string }[]
  }> {
    const successful: Expense[] = []
    const failed: { expense: CreateExpenseRequest; error: string }[] = []
    
    //** Process in batches of 25 (DynamoDB limit)
    const batchSize = 25
    for (let i = 0; i < expenses.length; i += batchSize) {
      const batch = expenses.slice(i, i + batchSize)
      
      const writeRequests = batch.map(expenseData => {
        try {
          const expenseId = this.generateExpenseId()
          const now = new Date().toISOString()
          const date = expenseData.date || new Date().toISOString().split('T')[0]
          const category = expenseData.category || this.autoCategorizeMalaysian(expenseData.description, expenseData.amount)
          
          const expense: ExpenseItem = {
            PK: `USER#${userId}`,
            SK: `EXPENSE#${date}#${expenseId}`,
            Type: 'EXPENSE',
            GSI1PK: `USER#${userId}#CATEGORY#${category}`,
            GSI1SK: `${date}#${expenseId}`,
            description_lowercase: expenseData.description.toLowerCase(),
            id: expenseId,
            userId,
            description: expenseData.description,
            amount: expenseData.amount,
            amountMYR: this.formatMYR(expenseData.amount),
            category,
            date,
            merchant: expenseData.merchant,
            location: expenseData.location,
            notes: expenseData.notes,
            paymentMethod: expenseData.paymentMethod,
            confidence: expenseData.category ? 100 : this.getCategorizationConfidence(expenseData.description),
            createdAt: now,
            updatedAt: now
          }
          
          successful.push(this.itemToExpense(expense))
          
          return {
            PutRequest: {
              Item: expense
            }
          }
        } catch (error) {
          failed.push({ 
            expense: expenseData, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })
          return null
        }
      }).filter(Boolean) as any[]
      
      if (writeRequests.length > 0) {
        await dynamodb.send(new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: writeRequests
          }
        }))
      }
    }
    
    return { successful, failed }
  }
  
  // ========================================
  //** READ OPERATIONS
  // ========================================
  
  /**
   * Get expenses for a user (with filtering and pagination)
   * This is like your API call to get data, but from DynamoDB
   */
  async getExpenses(params: GetExpensesRequest): Promise<PaginationResult<Expense>> {
    const { userId, startDate, endDate, category, limit = 20, lastEvaluatedKey } = params
    
    let queryParams: any
    
    if (category) {
      //** Query using GSI for category-based filtering
      queryParams = {
        TableName: TABLE_NAME,
        IndexName: 'CategoryDateIndex',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${userId}#CATEGORY#${category}`
        },
        ScanIndexForward: false, //** Sort by date descending (newest first)
        Limit: limit
      }
      
      //** Add date range if specified
      if (startDate && endDate) {
        queryParams.KeyConditionExpression += ' AND GSI1SK BETWEEN :startDate AND :endDate'
        queryParams.ExpressionAttributeValues[':startDate'] = startDate
        queryParams.ExpressionAttributeValues[':endDate'] = endDate + '#ZZZZ' //** Ensure we get all items from end date
      }
    } else {
      //** Query main table for all user expenses
      queryParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'EXPENSE#'
        },
        ScanIndexForward: false, //** Sort by date descending (newest first)
        Limit: limit
      }
      
      //** Add date range if specified
      if (startDate && endDate) {
        queryParams.KeyConditionExpression = 'PK = :pk AND SK BETWEEN :startDate AND :endDate'
        queryParams.ExpressionAttributeValues[':startDate'] = `EXPENSE#${startDate}`
        queryParams.ExpressionAttributeValues[':endDate'] = `EXPENSE#${endDate}#ZZZZ`
      }
    }
    
    //** Add pagination
    if (lastEvaluatedKey) {
      queryParams.ExclusiveStartKey = JSON.parse(lastEvaluatedKey)
    }
    
    const result = await dynamodb.send(new QueryCommand(queryParams))
    
    const expenses = result.Items?.map(item => this.itemToExpense(item as ExpenseItem)) || []
    
    return {
      items: expenses,
      lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
      hasMore: !!result.LastEvaluatedKey
    }
  }
  
  /**
   * Get a single expense by ID
   */
  async getExpenseById(userId: string, expenseId: string, date: string): Promise<Expense | null> {
    const result = await dynamodb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `EXPENSE#${date}#${expenseId}`
      }
    }))
    
    return result.Item ? this.itemToExpense(result.Item as ExpenseItem) : null
  }
  
  /**
   * Get recent expenses for dashboard
   */
  async getRecentExpenses(userId: string, limit: number = 5): Promise<Expense[]> {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'EXPENSE#'
      },
      ScanIndexForward: false, //** Sort by date descending (newest first)
      Limit: limit
    }))
    
    return result.Items?.map(item => this.itemToExpense(item as ExpenseItem)) || []
  }
  
  // ========================================
  //** UPDATE OPERATIONS
  // ========================================
  
  /**
   * Update an existing expense
   */
  async updateExpense(userId: string, expenseId: string, date: string, updates: UpdateExpenseRequest): Promise<Expense | null> {
    const now = new Date().toISOString()
    
    //** Build update expression dynamically
    const updateExpressions: string[] = []
    const expressionAttributeValues: any = {}
    const expressionAttributeNames: any = {}
    
    if (updates.description !== undefined) {
      updateExpressions.push('#desc = :description, description_lowercase = :descriptionLower')
      expressionAttributeNames['#desc'] = 'description'
      expressionAttributeValues[':description'] = updates.description
      expressionAttributeValues[':descriptionLower'] = updates.description.toLowerCase()
    }
    
    if (updates.amount !== undefined) {
      updateExpressions.push('amount = :amount, amountMYR = :amountMYR')
      expressionAttributeValues[':amount'] = updates.amount
      expressionAttributeValues[':amountMYR'] = this.formatMYR(updates.amount)
    }
    
    if (updates.category !== undefined) {
      updateExpressions.push('category = :category')
      expressionAttributeValues[':category'] = updates.category
      
      //** Update GSI1PK for category changes
      updateExpressions.push('GSI1PK = :gsi1pk')
      expressionAttributeValues[':gsi1pk'] = `USER#${userId}#CATEGORY#${updates.category}`
    }
    
    if (updates.merchant !== undefined) {
      updateExpressions.push('merchant = :merchant')
      expressionAttributeValues[':merchant'] = updates.merchant
    }
    
    if (updates.location !== undefined) {
      updateExpressions.push('#loc = :location')
      expressionAttributeNames['#loc'] = 'location'
      expressionAttributeValues[':location'] = updates.location
    }
    
    if (updates.notes !== undefined) {
      updateExpressions.push('notes = :notes')
      expressionAttributeValues[':notes'] = updates.notes
    }
    
    if (updates.paymentMethod !== undefined) {
      updateExpressions.push('paymentMethod = :paymentMethod')
      expressionAttributeValues[':paymentMethod'] = updates.paymentMethod
    }
    
    //** Always update the updatedAt timestamp
    updateExpressions.push('updatedAt = :updatedAt')
    expressionAttributeValues[':updatedAt'] = now
    
    if (updateExpressions.length === 1) { //** Only updatedAt
      throw new Error('No fields to update')
    }
    
    const result = await dynamodb.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `EXPENSE#${date}#${expenseId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length > 0 ? expressionAttributeNames : undefined,
      ReturnValues: 'ALL_NEW'
    }))
    
    return result.Attributes ? this.itemToExpense(result.Attributes as ExpenseItem) : null
  }
  
  // ========================================
  //** DELETE OPERATIONS
  // ========================================
  
  /**
   * Delete an expense
   */
  async deleteExpense(userId: string, expenseId: string, date: string): Promise<boolean> {
    await dynamodb.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `USER#${userId}`,
        SK: `EXPENSE#${date}#${expenseId}`
      }
    }))
    
    return true
  }
  
  // ========================================
  //** SEARCH OPERATIONS
  // ========================================
  
  /**
   * Search expenses by description (Database-level filtering)
   * Frontend Analogy: Like filtering an array, but we're filtering in the database
   */
  async searchExpensesByDescription(userId: string, searchTerm: string, limit: number = 20): Promise<Expense[]> {
    //** Use Query instead of Scan for better performance
    //** Filter at database level using the description_lowercase field
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: 'contains(description_lowercase, :searchTerm)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'EXPENSE#',
        ':searchTerm': searchTerm.toLowerCase()
      },
      ScanIndexForward: false, //** Sort by date descending (newest first)
      Limit: limit
    }))
    
    return result.Items?.map(item => this.itemToExpense(item as ExpenseItem)) || []
  }

  // ========================================
  //** TODO: ANALYTICS OPERATIONS [WIP !!]
  // ========================================
  
  /**
   * Get spending analytics for dashboard
   */
  async getSpendingAnalytics(userId: string, startDate: string, endDate: string) {
    const result = await dynamodb.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND SK BETWEEN :startDate AND :endDate',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':startDate': `EXPENSE#${startDate}`,
        ':endDate': `EXPENSE#${endDate}#ZZZZ`
      }
    }))
    
    const expenses = result.Items?.map(item => this.itemToExpense(item as ExpenseItem)) || []
    
    //** Calculate analytics
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const transactionCount = expenses.length
    const avgTransactionAmount = transactionCount > 0 ? totalSpent / transactionCount : 0
    
    //** Group by category
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
    
    const spendingByCategory = Object.entries(categoryTotals).map(([category, amount]) => {
      const numAmount = amount as number
      return {
        category: category as MalaysianCategory,
        amount: numAmount,
        amountMYR: this.formatMYR(numAmount),
        percentage: totalSpent > 0 ? Math.round((numAmount / totalSpent) * 100) : 0,
        transactionCount: expenses.filter(e => e.category === category).length
      }
    })
    
    return {
      totalSpent,
      totalSpentMYR: this.formatMYR(totalSpent),
      transactionCount,
      avgTransactionAmount,
      avgTransactionAmountMYR: this.formatMYR(avgTransactionAmount),
      spendingByCategory
    }
  }
  
  // ========================================
  //** UTILITY METHODS
  // ========================================
  
  /**
   * Convert DynamoDB item to Expense object
   */
  private itemToExpense(item: ExpenseItem): Expense {
    const { PK, SK, Type, GSI1PK, GSI1SK, ...expense } = item
    return expense as Expense
  }
  
  /**
   * Generate unique expense ID
   */
  private generateExpenseId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * Format amount to Malaysian Ringgit display format
   */
  private formatMYR(amountInCents: number): string {
    const amount = amountInCents / 100
    return `RM ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  }
  
  /**
   * Auto-categorize expenses based on Malaysian patterns
   */
  private autoCategorizeMalaysian(description: string, amount: number): MalaysianCategory {
    const desc = description.toLowerCase()
    
    //** Check merchant patterns
    for (const [pattern, keywords] of Object.entries(MALAYSIAN_CONFIG.MERCHANT_PATTERNS)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        switch (pattern) {
          case 'MAMAK': return MalaysianCategory.FOOD_MAMAK
          case 'GRAB': return desc.includes('food') ? MalaysianCategory.FOOD_DELIVERY : MalaysianCategory.TRANSPORT_GRAB
          case 'STARBUCKS': return MalaysianCategory.FOOD_COFFEE
          case 'PETROL': return MalaysianCategory.TRANSPORT_FUEL
          case 'SHOPPING': return MalaysianCategory.SHOPPING_ONLINE
        }
      }
    }
    
    //** Check amount patterns for common Malaysian expenses
    if (amount >= MALAYSIAN_CONFIG.TYPICAL_AMOUNTS.MAMAK_MEAL.min && 
        amount <= MALAYSIAN_CONFIG.TYPICAL_AMOUNTS.MAMAK_MEAL.max) {
      if (desc.includes('food') || desc.includes('makan') || desc.includes('restaurant')) {
        return MalaysianCategory.FOOD_RESTAURANT
      }
    }
    
    if (amount >= MALAYSIAN_CONFIG.TYPICAL_AMOUNTS.GRAB_RIDE.min && 
        amount <= MALAYSIAN_CONFIG.TYPICAL_AMOUNTS.GRAB_RIDE.max) {
      if (desc.includes('transport') || desc.includes('ride') || desc.includes('taxi')) {
        return MalaysianCategory.TRANSPORT_GRAB
      }
    }
    
    //** Default categorization
    if (desc.includes('food') || desc.includes('makan') || desc.includes('eat')) {
      return MalaysianCategory.FOOD_RESTAURANT
    }
    
    if (desc.includes('fuel') || desc.includes('petrol') || desc.includes('gas')) {
      return MalaysianCategory.TRANSPORT_FUEL
    }
    
    if (desc.includes('parking')) {
      return MalaysianCategory.TRANSPORT_PARKING
    }
    
    return MalaysianCategory.OTHER_MISCELLANEOUS
  }
  
  /**
   * Get confidence score for auto-categorization
   */
  private getCategorizationConfidence(description: string): number {
    const desc = description.toLowerCase()
    
    //** High confidence patterns
    for (const keywords of Object.values(MALAYSIAN_CONFIG.MERCHANT_PATTERNS)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return 95
      }
    }
    
    //** Medium confidence patterns
    const mediumConfidenceKeywords = ['food', 'transport', 'fuel', 'parking', 'coffee']
    if (mediumConfidenceKeywords.some(keyword => desc.includes(keyword))) {
      return 75
    }
    
    //** Low confidence fallback
    return 50
  }
}

//** Export singleton instance
export const expenseRepository = new ExpenseRepository()
