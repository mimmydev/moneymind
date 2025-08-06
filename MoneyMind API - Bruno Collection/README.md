# MoneyMind API - Bruno Collection

This Bruno collection contains API requests for testing the MoneyMind API deployed on AWS Lambda.

## Setup Instructions

1. **Install Bruno**: Download and install Bruno from [https://www.usebruno.com/](https://www.usebruno.com/)

2. **Open Collection**: 
   - Launch Bruno
   - Click "Open Collection"
   - Navigate to this `bruno-collection` folder
   - Select the folder to open the collection

3. **Environment Variables**:
   The collection uses these variables (already configured):
   - `baseUrl`: `https://a688uo5l5i.execute-api.ap-southeast-5.amazonaws.com/dev`
   - `apiPath`: `/api`

## Available Requests

### 1. API Root
- **Method**: GET
- **URL**: `{{baseUrl}}{{apiPath}}/`
- **Purpose**: Get API information and available endpoints
- **Expected Response**: Welcome message with API details

### 2. Health Check
- **Method**: GET
- **URL**: `{{baseUrl}}{{apiPath}}/health`
- **Purpose**: Check if the API is running and healthy
- **Expected Response**: Health status with timestamp

### 3. Get Expenses
- **Method**: GET
- **URL**: `{{baseUrl}}{{apiPath}}/expenses`
- **Purpose**: Get all expenses (currently a placeholder)
- **Current Status**: Logs test message, returns empty response

### 4. Get Analytics
- **Method**: GET
- **URL**: `{{baseUrl}}{{apiPath}}/analytics`
- **Purpose**: Get analytics data
- **Expected Response**: Test message with timestamp

## How to Test

1. **Start with Health Check**: Run the "Health Check" request to verify the API is working
2. **Test API Root**: Run "API Root" to see available endpoints
3. **Test Other Endpoints**: Try the expenses and analytics endpoints

## Notes

- All endpoints currently work without authentication
- The expenses endpoint is mostly placeholder code
- CORS is enabled for all origins
- All responses are in JSON format

## Troubleshooting

If you get errors:
1. Check that the API is deployed and the URLs are correct
2. Verify your internet connection
3. Check the Bruno console for detailed error messages
4. Ensure the AWS Lambda function is running properly
