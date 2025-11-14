# Quick Setup Guide

This document provides a quick reference for setting up the Todo Platform development environment.

## Prerequisites

- Node.js 18+ (use `.nvmrc` for version management)
- npm 9+
- PostgreSQL (for backend development)

## One-Time Setup

1. **Clone and Install Dependencies**

   ```bash
   git clone <repository-url>
   cd todo-platform
   npm run install:all
   ```

2. **Environment Setup**

   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database configuration

   # Frontend environment
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your API configuration
   ```

3. **Database Setup** (Backend)
   ```bash
   cd backend
   # Create database and run migrations
   npx prisma migrate dev
   npx prisma generate
   ```

## Daily Development

1. **Start Development Servers**

   ```bash
   # From root directory - starts both frontend and backend
   npm run dev
   ```

2. **Code Quality Checks**

   ```bash
   # Lint all files
   npm run lint

   # Fix linting issues
   npm run lint:fix

   # Format all files
   npm run format
   ```

3. **Testing**
   ```bash
   # Run all tests
   npm run test
   ```

## Project Structure

```
todo-platform/
├── backend/           # Node.js + Express API
├── frontend/          # React + Vite application
├── docs/             # Documentation
├── package.json       # Root workspace configuration
└── README.md          # Detailed project information
```

## Key Commands

| Command               | Description               |
| --------------------- | ------------------------- |
| `npm run install:all` | Install all dependencies  |
| `npm run dev`         | Start development servers |
| `npm run build`       | Build all applications    |
| `npm run lint`        | Check code quality        |
| `npm run format`      | Format code               |
| `npm run test`        | Run tests                 |

## Troubleshooting

### Common Issues

1. **Node.js Version**: Ensure you're using Node.js 18+

   ```bash
   nvm use  # Will use version from .nvmrc
   ```

2. **Database Connection**: Check your `.env` file configuration

3. **Port Conflicts**: Default ports are 3001 (backend) and 5173 (frontend)

4. **Linting Errors**: Run `npm run lint:fix` to auto-fix issues

### Getting Help

- Check the main `README.md` for detailed information
- Review `docs/architecture.md` for technical details
- See `docs/CONTRIBUTING.md` for development guidelines

## Next Steps

After setup, you can:

1. Start building features in the backend (`backend/src/`)
2. Develop UI components in the frontend (`frontend/src/`)
3. Define database schema with Prisma (`backend/prisma/`)
4. Add tests to the test directories

Happy coding! 🚀
