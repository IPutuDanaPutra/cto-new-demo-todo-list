# Todo Platform Backend

Backend API for the Todo Platform, built with Node.js, Express, and TypeScript.

## Architecture Overview

The backend follows a layered architecture pattern with clear separation of concerns:

```
src/
├── app.ts              # Express application setup and middleware configuration
├── server.ts           # Server initialization and graceful shutdown
├── index.ts            # Application entry point
├── config/             # Configuration and environment validation
│   ├── env.ts          # Environment variable validation with Zod
│   ├── logger.ts       # Winston logger configuration
│   └── index.ts        # Configuration exports
├── routes/             # API route definitions
│   ├── health.routes.ts
│   └── index.ts
├── controllers/        # Request handlers
│   ├── health.controller.ts
│   └── index.ts
├── services/           # Business logic layer
├── middleware/         # Express middlewares
│   ├── correlationId.ts   # Request correlation ID tracking
│   ├── errorHandler.ts    # Global error handler
│   ├── requestLogger.ts   # HTTP request logging
│   └── index.ts
├── utils/              # Utility functions and classes
│   ├── ApiError.ts     # Custom error class
│   ├── correlationId.ts
│   └── index.ts
└── __tests__/          # Integration tests
    ├── health.test.ts
    └── errorHandler.test.ts
```

## Features

- **TypeScript**: Fully typed codebase for better developer experience
- **Environment Validation**: Zod-based configuration validation with descriptive errors
- **Security**: Helmet, CORS, and secure headers
- **Logging**: Winston for structured logging with multiple transports
- **Request Tracking**: Correlation ID middleware for request tracing
- **Error Handling**: Centralized error handler with standardized API responses
- **Compression**: Response compression for better performance
- **Testing**: Jest and Supertest for integration testing
- **Hot Reload**: Development server with automatic TypeScript recompilation

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PostgreSQL database (for future features)

## Environment Variables

Copy `.env.example` to `.env` and configure the following required variables:

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (minimum 32 characters)
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens (minimum 32 characters)
- `FRONTEND_URL`: URL of the frontend application for CORS

### Optional Variables

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development, production, test)
- `JWT_EXPIRES_IN`: JWT token expiration (default: 15m)
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expiration (default: 7d)
- `LOG_LEVEL`: Logging level (error, warn, info, http, verbose, debug, silly)
- `LOG_FILE`: Log file path (default: ./logs/app.log)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window

## Scripts

### Development

```bash
npm run dev
```

Starts the development server with hot reload using `tsx watch`. The server automatically restarts when files change.

### Building

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Production

```bash
npm start
```

Runs the compiled JavaScript from the `dist/` directory. Make sure to run `npm run build` first.

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Database Operations

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Deploy migrations to production
npm run db:deploy

# Open Prisma Studio
npm run db:studio

# Seed the database
npm run db:seed
```

## API Endpoints

### Health Check

**GET** `/health`

Returns the health status of the service with metadata.

**Response:**

```json
{
  "status": "healthy",
  "service": "@todo-platform/backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

**Headers:**

- `X-Correlation-ID`: Request correlation ID for tracking

## Error Handling

All errors follow a standardized format:

```json
{
  "status": "error",
  "message": "Error description",
  "correlationId": "uuid-v4-correlation-id",
  "stack": "Stack trace (development only)"
}
```

### Error Types

- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `500 Internal Server Error`: Server error

## Configuration Validation

The application validates all required environment variables on startup using Zod. If validation fails, you'll see a detailed error message indicating which variables are missing or invalid:

```
❌ Environment validation failed:

  - DATABASE_URL: Required
  - JWT_SECRET: JWT_SECRET must be at least 32 characters

Please check your .env file and ensure all required variables are set correctly.
```

## Logging

The application uses Winston for structured logging with the following features:

- Multiple log levels (error, warn, info, http, verbose, debug, silly)
- Console output with colors in development
- File output for persistent logs
- Automatic log rotation
- Request/response logging with Morgan integration

## Testing

Tests are written using Jest and Supertest for integration testing. The test suite includes:

- Health endpoint tests
- Error handler middleware tests
- Correlation ID tracking tests

All tests run in isolation and don't require external dependencies.

## Development Guidelines

1. **TypeScript Strict Mode**: The project uses strict TypeScript settings for type safety
2. **Error Handling**: Always use the `ApiError` class for operational errors
3. **Logging**: Use the configured `logger` instead of `console.log`
4. **Validation**: Use Zod for request validation
5. **Async/Await**: Prefer async/await over callbacks or raw promises
6. **Testing**: Write integration tests for all API endpoints

## Production Considerations

Before deploying to production:

1. Set `NODE_ENV=production`
2. Use strong, random secrets for JWT tokens
3. Configure proper database credentials
4. Set up log rotation and monitoring
5. Enable rate limiting
6. Configure proper CORS origins
7. Set up health checks and monitoring
8. Use environment-specific configuration
9. Enable HTTPS
10. Configure graceful shutdown handlers

## Troubleshooting

### Configuration Errors

If you see configuration validation errors:

1. Check your `.env` file exists
2. Verify all required variables are set
3. Ensure JWT secrets are at least 32 characters
4. Validate the DATABASE_URL format
5. Check FRONTEND_URL is a valid URL

### Port Already in Use

If the port is already in use:

```bash
# Find the process using the port
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### TypeScript Errors

If you encounter TypeScript errors:

```bash
# Clean build artifacts
rm -rf dist

# Rebuild
npm run build
```

## License

This project is part of the Todo Platform application.
