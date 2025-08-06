export const expensesRoutes = (api) => {
  
  //TODO: GET /api/expenses - Get all expenses for a user
  api.get('/expenses', async (req, res) => {
    try {
      console.log("MoneyMind API test server running")
    } catch (error) {
      console.error('Get error:', error);
      throw {
        statusCode: 500,
        message: 'Failed'
      };
    }
  });

  //TODO: GET /api/expenses/:id - Get specific expense

  //TODO: POST /api/expenses - Create new expense

  //TODO: PUT /api/expenses/:id - Update expense

  //TODO: DELETE /api/expenses/:id - Delete expense

  //TODO: POST /api/expenses/bulk - Bulk create expenses (for CSV import)
};
