# moneymind

This folder was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Nuxt, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Nuxt** - The Intuitive Vue Framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn-vue** - Beautifully designed Vue components built with Radix Vue and Tailwind CSS
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```


Then, run the development server:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.



## Project Structure

```
moneymind/
├── frontend/
│   ├── web/         # Frontend application (Nuxt)
```

## Available Scripts

- `bun dev`: Start all applications in development mode
- `bun build`: Build all applications
- `bun dev:web`: Start only the web application
- `bun check-types`: Check TypeScript types across all frontend

## shadcn-vue Components

This project uses [shadcn-vue](https://www.shadcn-vue.com/) for UI components. Components are automatically installed to `apps/web/app/components/ui/`.

### Adding new components:


# Navigate to the web app directory
```bash
cd frontend/web
```

# Add a specific component
bunx shadcn-vue@latest add [component-name]

# Example: Add a dialog component
```bash
bunx shadcn-vue@latest add dialog
```

### Using components:
Thanks to Nuxt's auto-import feature, you can use shadcn-vue components directly in your templates:

```vue
<template>
  <div>
    <Button>Click me</Button>
    <Button variant="outline">Outline Button</Button>
  </div>
</template>
```
