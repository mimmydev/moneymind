# MoneyMind API Backend

This directory contains the serverless backend for the MoneyMind application. It's a RESTful API built with Node.js, the Serverless Framework, and deployed on AWS Lambda.

## Core Technologies

- **Runtime**: Node.js 20.x
- **Bun**: This project uses [Bun](https://bun.sh/) as its fast package manager and script runner. Please install it before proceeding.
- **An AWS Account**: Deployment requires an active AWS account. The services used (Lambda, API Gateway, DynamoDB) have a generous free tier, making it free for development and low-traffic applications.
- **AWS CLI**: You must have the [AWS CLI installed](https://aws.amazon.com/cli/) and configured with your credentials (`aws configure`). The Serverless Framework uses these credentials to deploy the infrastructure to your account.
- **Core Services**: AWS Lambda, API Gateway, DynamoDB, CloudWatch for debugging

---

## Architectural Decisions & Reasoning

The backend architecture was designed with a specific set of goals in mind: scalability, cost-efficiency while utilize AWS Free Tier, and maintainability as if I want to maintain in the future how should I design it?

### 1. The Core Decision: Serverless Architecture

The primary technical decision was to adopt a **serverless architecture** using:

- **AWS Lambda**
- **API Gateway**
- **DynamoDB**.

**Why was this chosen?**

- Its very simple, I want to explore my AWS free tier :)

### 2. The Database Design: DynamoDB with a Single-Table Design

**Why DynamoDB (a NoSQL database)?**

- Hands on DynamoDB because why not !

**Why a "Single-Table Design"?**

This is a best-practice pattern for DynamoDB that optimizes for performance and cost by retrieving all data needed for a specific view in a **single, highly-efficient query**.

- **How it Works**: I use a composite primary key (`PK` and `SK`) to structure the data intelligently.
  - **`PK` (Partition Key): `USER#{userId}`**: Groups all data for a single user, making the design ready for future multi-user support.
  - **`SK` (Sort Key): `EXPENSE#{date}#{expenseId}`**: Organizes expenses chronologically, enabling very fast queries for recent items or specific date ranges.
- **The Power of the GSI**: The `CategoryDateIndex` (a Global Secondary Index) allows us to perform fast queries on a different data dimension, such as "get all expenses in the 'Food' category." This avoids slow and expensive table scans.

### 3. System Architecture

The backend follows a serverless, API-first architecture. All infrastructure is defined as code in the `serverless.yml` file.

1.  **API Gateway**: Acts as the front door for all incoming HTTP requests. It routes requests to the appropriate Lambda function based on the path and method.
2.  **AWS Lambda**: The core of the backend where all business logic resides. Each API endpoint is mapped to a specific handler function within the `src/handler/` directory. The application uses a monolithic Lambda approach where a single function (`main.main`) routes requests, but specific handlers are defined for clarity.
3.  **DynamoDB**: A fully managed NoSQL database used for all data persistence. It's configured for high performance and scalability.
4.  **IAM Roles**: The `serverless.yml` file defines precise IAM permissions, ensuring the Lambda functions have the exact permissions needed to interact with DynamoDB and nothing more (Principle of Least Privilege).

A typical request flows as follows:
`Client -> API Gateway -> Lambda Handler -> Service Logic -> DynamoDB Repository -> DynamoDB`

---

## Database Design (DynamoDB Single-Table Design)

Since this project utilizes a **single-table design** in DynamoDB, all data types are stored in a single table and distinguished by their primary key structure.

**Table Name**: `moneymind-api-{stage}-expenses` (e.g., `moneymind-api-dev-expenses`)

### Primary Key Structure

- **`PK` (Partition Key)**: `USER#{userId}`
  - This partitions the data by user. While the current version of the app is single-user, this design is ready for future multi-tenancy.
- **`SK` (Sort Key)**: `EXPENSE#{date}#{expenseId}`
  - This allows for efficient querying of expenses for a specific user, sorted chronologically. The format enables powerful queries like "get all expenses in a given month."

### Global Secondary Index (GSI) for Category Queries

To enable efficient querying by expense category, a GSI is defined.

- **Index Name**: `CategoryDateIndex`
- **`GSI1PK` (Partition Key)**: `USER#{userId}#CATEGORY#{category}`
  - This allows us to fetch all expenses for a specific user that belong to a particular category.
- **`GSI1SK` (Sort Key)**: `{date}#{expenseId}`
  - This sorts the expenses within a category by date.

This design allows for highly performant and flexible data access patterns, avoiding slow and costly `Scan` operations.

---

## Project Structure

The source code is organized to maintain a clear separation of concerns.

- `src/handler/`: Contains the Lambda handler functions. These are the entry points for API requests. Their primary role is to parse the incoming request, call the appropriate service, and format the HTTP response.
- `src/service/`: This layer holds the core business logic. It's called by the handlers and interacts with the data repository.
- `src/helper/`: Contains reusable utility functions, such as data transformation or validation logic, that can be used across services.
- `serverless.yml`: The master configuration file. It defines all AWS resources, API endpoints, permissions, and environment variables.

---

## API Endpoints

The following endpoints are defined in `serverless.yml`:

| Method    | Path                   | Handler (`expenses.js`)       | Description                               |
| :-------- | :--------------------- | :---------------------------- | :---------------------------------------- |
| `GET`     | `/api/expenses`        | `getExpenses`                 | Get all expenses.                         |
| `GET`     | `/api/expenses/{id}`   | `getExpense`                  | Get a single expense by its ID.           |
| `POST`    | `/api/expenses`        | `createExpense`               | Create a new expense.                     |
| `PUT`     | `/api/expenses/{id}`   | `updateExpense`               | Update an existing expense.               |
| `DELETE`  | `/api/expenses/{id}`   | `destroyExpense`              | Delete an expense.                        |
| `GET`     | `/api/expenses/search` | `searchExpenses`              | Search for expenses based on criteria.    |
| `POST`    | `/api/expenses/bulk`   | `bulkCreateExpenses`          | Bulk create expenses from a JSON payload. |
| `POST`    | `/api/expenses/csv`    | `uploadCSV`                   | Upload a CSV file of expenses for import. |
| `GET`     | `/api/analytics`       | `getAnalytics` (analytics.js) | Get computed analytics for the dashboard. |
| `OPTIONS` | `/{proxy+}`            | `handleOptions` (options.js)  | Handles CORS preflight requests.          |

---

## Data Model

### Expense Object Structure

Each expense record stored in DynamoDB contains the following fields:

```javascript
{
  PK: "USER#default",           // Partition Key
  SK: "EXPENSE#2025-01-08#uuid", // Sort Key
  GSI1PK: "USER#default#CATEGORY#Food", // GSI Partition Key
  GSI1SK: "2025-01-08#uuid",    // GSI Sort Key

  // Core expense data
  id: "uuid",                   // Unique expense identifier
  date: "2025-01-08",          // ISO date string
  description: "Nasi Ayam",     // Expense description
  amount: 3000,                // Amount in cents (30.00 MYR)
  merchant: "Pelita LD",       // Merchant/vendor name
  category: "Food",            // Expense category

  // Metadata
  createdAt: "2025-01-08T10:00:00Z", // ISO timestamp
  updatedAt: "2025-01-08T10:00:00Z"  // ISO timestamp
}
```

### Currency Handling

- All monetary amounts are stored as **integers in cents** (Malaysian sen)
- Frontend displays amounts in MYR with proper decimal formatting
- Example: 30.00 MYR is stored as `3000` cents

---

## Deployment

Deployment to AWS is handled by the Serverless Framework.

- **Deploy to development**:
  ```bash
  bun deploy:dev
  ```

## Environment Configuration

The backend uses environment variables defined in `.env` and managed by the `serverless-dotenv-plugin`:

- `STAGE`: Deployment stage (dev/prod)
- `DYNAMODB_TABLE`: Auto-generated table name
- `REGION`: AWS region (ap-southeast-5) Malaysia

## Performance Considerations

- **Cold Start Optimization**: ESBuild minimizes bundle size for faster cold starts
- **DynamoDB Design**: Single-table design reduces latency and cost
- **Provisioned Throughput**: Conservative settings for cost efficiency (1 RCU/WCU)
- **Point-in-Time Recovery**: Enabled for data protection

## Security Features

- **IAM Least Privilege**: Lambda functions have minimal required permissions
- **CORS Configuration**: Properly configured for cross-origin requests
- **Request Validation**: Joi schemas validate all incoming data
- **Error Handling**: Structured error responses without sensitive data exposure

---

For more information about the overall project architecture, see the main [README.md](../README.md) in the project root.
