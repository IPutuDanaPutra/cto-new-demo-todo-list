# Todo Platform

A full-stack React + Node.js application for managing tasks and todos with advanced features.

## Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query / TanStack Query** - Server state management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling with validation

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript development
- **Prisma** - Modern database toolkit and ORM
- **PostgreSQL** - Primary database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Schema validation

### Development Tools

- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files
- **npm workspaces** - Monorepo management

## Project Structure

```
todo-platform/
├── backend/           # Node.js + Express API
├── frontend/          # React + Vite application
├── docs/             # Documentation and architecture
├── .gitignore
├── .editorconfig
├── .nvmrc
├── package.json      # Root workspace configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ (use `.nvmrc` for version management)
- npm 9+
- PostgreSQL (for backend database)

### Installation

1. Clone the repository
2. Install dependencies at the root level:
   ```bash
   npm run install:all
   ```

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

### Code Quality

Run linting and formatting:

```bash
# Lint all files
npm run lint

# Fix linting issues
npm run lint:fix

# Format all files
npm run format

# Check formatting without fixing
npm run format:check
```

### Testing

Run tests across all packages:

```bash
npm run test
```

## Architecture Overview

### Backend Architecture

- RESTful API design with Express.js
- Layered architecture: routes → controllers → services → repositories
- Database access through Prisma ORM
- JWT-based authentication
- Input validation with Zod schemas
- Error handling middleware

### Frontend Architecture

- Component-based React architecture
- Route-based code splitting
- Server state management with TanStack Query
- Form management with React Hook Form
- Responsive design with Tailwind CSS
- Type-safe API client generation

### Database Schema

- Users table for authentication
- Todos table for task management
- Categories for task organization
- Tags for flexible labeling
- User preferences and settings

## Development Workflow

1. Create feature branches from `main`
2. Make changes with proper TypeScript typing
3. Run linting and formatting before committing
4. Git hooks will automatically run lint-staged on commit
5. Create pull requests for code review

## Roadmap

### Phase 1: Core Functionality

- [ ] User authentication (register/login)
- [ ] Basic CRUD operations for todos
- [ ] Category management
- [ ] Tag system
- [ ] User dashboard

### Phase 2: Advanced Features

- [ ] Real-time updates with WebSockets
- [ ] Task dependencies
- [ ] Search and filtering
- [ ] Bulk operations
- [ ] Data export/import

### Phase 3: Collaboration

- [ ] Team workspaces
- [ ] Task assignment
- [ ] Comments and activity feed
- [ ] Notifications
- [ ] Sharing and permissions

### Phase 4: Analytics & Insights

- [ ] Task completion analytics
- [ ] Productivity metrics
- [ ] Time tracking
- [ ] Progress reports
- [ ] Goal setting

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories for required environment variables.

## Contributing

1. Follow the existing code style and conventions
2. Write meaningful commit messages
3. Add tests for new features
4. Update documentation as needed
5. Ensure all linting checks pass before submitting PRs

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
