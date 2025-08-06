import express from 'express';
import cors from 'cors';
import { main } from './src/api/handler.js';

const app = express();
const port = 3003;

//** Middleware
app.use(cors());
app.use(express.json());

//** Convert Express request to Lambda event format
const convertToLambdaEvent = (req) => {
  return {
    httpMethod: req.method,
    path: req.path,
    pathParameters: req.params,
    queryStringParameters: req.query,
    headers: req.headers,
    body: JSON.stringify(req.body),
    requestContext: {
      requestId: Math.random().toString(36).substring(7)
    }
  };
};

//** Handle all routes through the Lambda handler
app.all('*', async (req, res) => {
  try {
    const event = convertToLambdaEvent(req);
    const context = {};
    
    const result = await main(event, context);
    
    //** Handle Lambda response format
    if (result.statusCode) {
      res.status(result.statusCode);
      
      if (result.headers) {
        Object.keys(result.headers).forEach(key => {
          res.set(key, result.headers[key]);
        });
      }
      
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      res.json(body);
    } else {
      //** Direct response from lambda-api
      res.json(result);
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: {
        message: 'Internal Server Error',
        type: 'ServerError'
      }
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 MoneyMind API test server running at http://localhost:${port}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${port}/api/health`);
  console.log(`   GET  http://localhost:${port}/api/expenses`);
  console.log(`   POST http://localhost:${port}/api/expenses`);
  console.log(`   GET  http://localhost:${port}/api/analytics`);
});
