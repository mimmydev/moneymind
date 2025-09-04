# MoneyMind

A smart personal expense tracker with intelligent categorization and real-time insights, built with a modern, full-stack, serverless architecture.

## About This Project

MoneyMind originated as a personal initiative to build a modern, full-stack financial application for hands-on learning and portfolio development. It has since evolved into a collaborative learning environment, with valuable contributions from several junior and mid-level colleagues.

Our primary goal is two-fold:

1. To create a powerful and user-friendly tool for personal finance management, and to provide a practical space for skill enhancement with modern web technologies.
2. Serves as a public portfolio, showcasing our collaborative development process and technical capabilities to the open-source community and especially future employers.

## Core Features

- **Expense Tracking**: Easily add, edit, delete, and view expenses.
- **Data Visualization**: Interactive charts for analyzing spending trends and category breakdowns.
- **Bulk Import**: Upload historical expense data from CSV or JSON files.
- **Search & Filter**: Quickly find specific transactions.
- **Responsive UI**: A clean and modern user interface that works on any device.

## System Architecture

This project is built on a **Serverless Full-Stack** model, emphasizing separation of concerns, type safety, and scalability.

- **Frontend**: A Nuxt.js (Vue 3) Single Page Application responsible for the user interface and experience.
- **Backend**: A set of serverless functions running on AWS Lambda that handle business logic and data persistence.
- **API**: A RESTful API layer managed by AWS API Gateway connects the frontend and backend.
- **Database**: AWS DynamoDB is used as the NoSQL database for storing expense data.

### Data Flow & Patterns

The application follows modern design patterns to ensure a clean and maintainable codebase:

- **API-First Design**: The backend provides a well-defined set of REST endpoints that the frontend consumes.
- **Component-Based UI**: The frontend is built with a modular, reusable component architecture using shadcn/ui.
- **State Management**: Centralized state management is handled by Pinia stores, providing a single source of truth.
- **Business Logic**: On the frontend, Nuxt Composables (`/composables`) encapsulate business logic, while a Service Layer (`/services`) manages all API communication. This keeps components clean and focused on the view.

A typical data flow for creating an expense looks like this:
`Component -> Pinia Store -> Service -> API Gateway -> Lambda Function -> DynamoDB`

## Tech Stack

This project is built with a modern, type-safe technology stack managed as a monorepo with **Bun** and **Turborepo**.

- **Frontend**: Nuxt.js 4, Vue 3, Pinia, Tailwind CSS, Chart.js, and TypeScript.
- **Backend**: Node.js, Serverless Framework, AWS Lambda, ESBuild, and TypeScript.
- **Database**: AWS DynamoDB.
- **Development Tools**: Prettier, oxlint for code quality, and Husky for Git hooks.

## Getting Started

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/mimmydev/moneymind.git
    cd moneymind
    ```

2.  **Check `/backend` folder** if you are trying to work on backend or core database, its highly recommend to open read the docs in `moneymind/MoneyMind API - Bruno Collection` as the documentation is much more clear over there and try open it using [Bruno](https://www.usebruno.com/)

3.  **Check `/frontend` folder README** if you are trying to work on frontend
