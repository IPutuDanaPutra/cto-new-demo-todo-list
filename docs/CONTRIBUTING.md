# Contributing to Todo Platform

Thank you for your interest in contributing to the Todo Platform! This document provides guidelines and information to help you get started.

## Getting Started

### Prerequisites

- Node.js 18+ (use `.nvmrc` for version management)
- npm 9+
- PostgreSQL (for backend development)
- Git

### Setup Instructions

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/todo-platform.git
   cd todo-platform
   ```

2. **Install Dependencies**

   ```bash
   npm run install:all
   ```

3. **Environment Setup**

   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database configuration

   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env with your API configuration
   ```

4. **Database Setup**

   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start Development**
   ```bash
   # From root directory
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical fixes for production

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Code Style**
   - Follow existing code conventions
   - Use TypeScript for type safety
   - Write descriptive variable and function names
   - Add JSDoc comments for complex functions

2. **Component Guidelines**
   - Keep components small and focused
   - Use composition over inheritance
   - Implement proper prop typing
   - Add error boundaries where appropriate

3. **API Guidelines**
   - Follow RESTful conventions
   - Use proper HTTP status codes
   - Validate all inputs
   - Return consistent error responses

### Testing

1. **Unit Tests**

   ```bash
   # Backend
   cd backend && npm test

   # Frontend
   cd frontend && npm test
   ```

2. **Integration Tests**

   ```bash
   # Backend API tests
   cd backend && npm run test:integration
   ```

3. **E2E Tests** (when implemented)
   ```bash
   npm run test:e2e
   ```

### Code Quality

Before submitting, ensure:

```bash
# Lint all files
npm run lint

# Fix linting issues
npm run lint:fix

# Format all files
npm run format

# Type checking
npm run type-check
```

## Commit Guidelines

### Commit Message Format

Use conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```bash
feat(auth): add JWT token refresh mechanism
fix(todo): resolve issue with due date validation
docs(api): update authentication endpoints documentation
```

### Pull Request Process

1. **Create Pull Request**
   - Target: `develop` branch (for features) or `main` (for hotfixes)
   - Use descriptive title and description
   - Link related issues

2. **PR Checklist**
   - [ ] Code follows project style guidelines
   - [ ] Self-review completed
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] All tests pass
   - [ ] No linting errors

3. **Code Review**
   - Be constructive and respectful
   - Focus on code quality and functionality
   - Ask questions if something is unclear
   - Suggest improvements when appropriate

## Project Structure

```
todo-platform/
├── backend/               # Node.js API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Data access
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── utils/         # Utilities
│   ├── prisma/            # Database schema
│   └── tests/             # Test files
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Route components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API services
│   │   ├── stores/        # State management
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utilities
│   └── tests/             # Test files
├── docs/                  # Documentation
└── shared/                # Shared utilities (future)
```

## Coding Standards

### TypeScript

- Use strict mode
- Prefer interfaces over types for object shapes
- Use explicit return types for public functions
- Avoid `any` type - use `unknown` or proper typing

### React

- Use functional components with hooks
- Implement proper error boundaries
- Use React Query for server state
- Prefer composition over inheritance

### Backend

- Use dependency injection where appropriate
- Implement proper error handling
- Use Zod for runtime validation
- Follow RESTful API design principles

### Database

- Use descriptive table and column names
- Implement proper indexing
- Use transactions for multi-table operations
- Include proper foreign key constraints

## Getting Help

- **Documentation**: Check the `docs/` directory
- **Issues**: Look at existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Maintainers**: Tag maintainers in issues for urgent matters

## Release Process

1. **Version Bumping**
   - Follow semantic versioning
   - Update changelog
   - Tag releases in Git

2. **Deployment**
   - Automated deployment for `main` branch
   - Manual deployment for hotfixes
   - Environment-specific configurations

Thank you for contributing to the Todo Platform!
