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
- **Prisma ORM** - Modern database toolkit with migrations and client generation
- **PostgreSQL** - Primary relational database
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Zod** - Schema validation
- **Winston** - Structured logging

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

### Database Setup

1. Start PostgreSQL using Docker:

   ```bash
   docker compose up -d db
   ```

2. Configure database in `backend/.env`:

   ```bash
   cp backend/.env.example backend/.env
   # Edit DATABASE_URL if needed
   ```

3. Run migrations and seed data:

   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

4. (Optional) Open Prisma Studio to view data:
   ```bash
   npm run db:studio
   ```

See [docs/database.md](docs/database.md) for detailed database instructions.

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

Or start them individually:

```bash
# Frontend only (port 5173)
cd frontend
npm run dev

# Backend only (port 3001)
cd backend
npm run dev
```

The frontend is configured to proxy API requests to the backend automatically.

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
- Data access layer with repository pattern for Prisma integration
- Database access through Prisma ORM with type safety
- JWT-based authentication
- Input validation with Zod schemas
- Error handling middleware with correlation IDs
- Structured logging with Winston

### Frontend Architecture

- Component-based React architecture with TypeScript
- Route-based code splitting with Vite
- Server state management with TanStack Query
- UI state management with Zustand (theme, etc.)
- Form management with React Hook Form + Zod validation
- Responsive design with Tailwind CSS and custom theme
- Type-safe API client with Axios interceptors
- Theme system (light/dark/system) with persistence
- Reusable UI components (Button, Card, Input, etc.)
- Layout system with sidebar and topbar navigation
- Comprehensive test suite with Vitest + React Testing Library

### Database Architecture

- PostgreSQL relational database with Prisma ORM
- Comprehensive schema covering:
  - User management and preferences
  - Categories for task organization
  - Tags with many-to-many relationships
  - Todo management with status and priority
  - Subtasks for breaking down todos
  - Attachments with metadata
  - Reminders with multiple channels
  - Recurrence rules for recurring todos
  - Activity logs for audit trails
  - View preferences for different display modes
- Strategic indexing for performance
- Cascading deletes for data integrity
- Migrations managed through Prisma Migrate

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

## Documentation

- **Backend**: See [backend/README.md](backend/README.md) for API documentation
- **Frontend**: See [frontend/README.md](frontend/README.md) for architecture and setup
- **Database**: See [docs/database.md](docs/database.md) for schema and setup details
- **Frontend Setup**: See [FRONTEND_SETUP.md](FRONTEND_SETUP.md) for quick start guide

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
