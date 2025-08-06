import lambdaApi from 'lambda-api';
import { expensesRoutes } from './expenses.js';
import { analyticsRoutes } from './analytics.js';

//** Initialize lambda-api
const api = lambdaApi({
  version: 'v1.0',
  base: '/api',
  cors: {
    origin: '*',
    credentials: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'
  }
});

//** Root endpoint
api.get('/', async (req, res) => {
  return {
    message: 'Welcome to MoneyMind API',
    version: '1.0.0',
    environment: process.env.STAGE || 'dev',
    endpoints: {
      health: '/api/health',
      expenses: '/api/expenses',
      analytics: '/api/analytics'
    },
    timestamp: new Date().toISOString()
  };
});

//** Health check endpoint
api.get('/health', async (req, res) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.STAGE || 'dev'
  };
});

//** Register route modules
expensesRoutes(api);
analyticsRoutes(api);

//** Global error handler
api.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  return res.status(err.statusCode || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      type: err.name || 'ServerError',
      timestamp: new Date().toISOString(),
      requestId: req.requestContext?.requestId
    }
  });
});

//** Lambda handler
export const main = async (event, context) => {
  try {
    //** Add request context for debugging
    console.log('Incoming request:', {
      method: event.httpMethod,
      path: event.path,
      stage: process.env.STAGE,
      timestamp: new Date().toISOString()
    });

    //** Process the request through lambda-api
    return await api.run(event, context);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: {
          message: 'Internal Server Error',
          type: 'HandlerError',
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};
