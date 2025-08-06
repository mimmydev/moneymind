export const analyticsRoutes = (api) => {
  //** Simple analytics endpoint for testing
  api.get('/analytics', async (req, res) => {
    return {
      message: 'Analytics endpoint working!',
      timestamp: new Date().toISOString()
    };
  });
};
