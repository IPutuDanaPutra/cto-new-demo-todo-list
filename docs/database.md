# Database Setup and Schema

## Overview

The Todo Platform uses PostgreSQL as its primary database with Prisma as the ORM (Object-Relational Mapping) toolkit. This document provides a comprehensive guide to the database setup, schema, and management.

## Architecture

- **Database**: PostgreSQL 16
- **ORM**: Prisma 5.x
- **Connection**: Environment variable `DATABASE_URL`
- **Migrations**: Managed by Prisma Migrate

## Quick Start

### 1. Start PostgreSQL with Docker

```bash
docker compose up -d db
```

This command:

- Starts a PostgreSQL 16 container
- Creates a database named `todo_platform`
- Sets up volumes for data persistence
- Uses credentials: `todo_user` / `todo_password`
- Exposes on port `5432`

Verify the database is running:

```bash
docker compose ps
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
DATABASE_URL="postgresql://todo_user:todo_password@localhost:5432/todo_platform"
```

Or copy and update `.env.example`:

```bash
cp backend/.env.example backend/.env
```

### 3. Run Migrations

Generate Prisma client and apply schema:

```bash
cd backend
npm run db:migrate
```

This command:

- Generates the Prisma client
- Creates the migration file
- Applies the schema to the database
- Creates all tables with proper indexes

### 4. Seed Demo Data

Populate the database with demo data:

```bash
npm run db:seed
```

This creates:

- 1 demo user (`demo@example.com`)
- 4 categories (Work, Personal, Shopping, Health)
- 4 tags (Urgent, Important, Review, Delegate)
- 7 sample todos with varying priorities and statuses
- Recurring todos (daily meditation, weekly standup)
- Subtasks, attachments, and reminders
- Activity logs and view preferences

## Database Schema

### User

Represents an application user with authentication and preferences.

```
- id (String, PK): Unique identifier
- email (String, Unique): User email
- displayName (String): User's display name
- timezone (String): User's timezone
- settings (JSON): User preferences and settings
- createdAt (DateTime): Account creation timestamp
- updatedAt (DateTime): Last update timestamp
```

### Category

Organizes todos into user-defined categories.

```
- id (String, PK): Unique identifier
- userId (String, FK): Owner user
- name (String): Category name
- color (String): Hex color code
- ordering (Int): Display order
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp

Unique Constraint: [userId, name]
Indexes: userId
```

### Tag

Flexible labels for todos using many-to-many relationship.

```
- id (String, PK): Unique identifier
- userId (String, FK): Owner user
- name (String): Tag name
- color (String): Hex color code

Unique Constraint: [userId, name]
Indexes: userId
```

### TodoTag (Join Table)

Many-to-many relationship between todos and tags.

```
- id (String, PK): Unique identifier
- todoId (String, FK): Todo reference
- tagId (String, FK): Tag reference

Unique Constraint: [todoId, tagId]
Indexes: todoId, tagId
```

### Todo

Core task management entity.

```
- id (String, PK): Unique identifier
- userId (String, FK): Owner user
- categoryId (String, FK, Nullable): Associated category
- title (String): Todo title
- description (String): Detailed description
- status (Enum): TODO | IN_PROGRESS | DONE | CANCELLED
- priority (Enum): LOW | MEDIUM | HIGH | URGENT
- startDate (DateTime, Nullable): When todo starts
- dueDate (DateTime, Nullable): When todo is due
- reminderLeadTime (Int, Nullable): Minutes before due date
- recurrenceRuleId (String, FK, Nullable): For recurring todos
- completedAt (DateTime, Nullable): When marked done
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp

Indexes: userId, categoryId, status, dueDate
```

### Subtask

Breaks down todos into smaller steps.

```
- id (String, PK): Unique identifier
- todoId (String, FK): Parent todo
- userId (String, FK): Owner user
- title (String): Subtask title
- completed (Boolean): Completion status
- ordering (Int): Display order
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp

Indexes: todoId, userId
```

### Attachment

Metadata for attachments associated with todos (file uploads not stored in DB).

```
- id (String, PK): Unique identifier
- todoId (String, FK): Associated todo
- userId (String, FK): Owner user
- fileName (String): Original filename
- fileSize (Int): Size in bytes
- mimeType (String): Content type
- url (String, Nullable): Download URL
- createdAt (DateTime): Upload timestamp
- updatedAt (DateTime): Last update timestamp

Indexes: todoId, userId
```

### Reminder

Notifications for todos.

```
- id (String, PK): Unique identifier
- todoId (String, FK): Associated todo
- userId (String, FK): Owner user
- scheduledAt (DateTime): When reminder should trigger
- channel (Enum): IN_APP | EMAIL | PUSH
- sent (Boolean): Whether reminder was sent
- sentAt (DateTime, Nullable): When reminder was sent
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp

Indexes: todoId, userId, scheduledAt
```

### RecurrenceRule

Defines recurrence patterns for recurring todos.

```
- id (String, PK): Unique identifier
- frequency (Enum): DAILY | WEEKLY | MONTHLY | YEARLY
- interval (Int): Repeat every N periods
- byWeekday (JSON, Nullable): ISO weekday strings ["MO", "TU", "WE", ...]
- byMonthDay (JSON, Nullable): Days of month [1, 15, -1]
- endDate (DateTime, Nullable): When recurrence ends
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp
```

### ViewPreference

Stores user's view preferences for different view types.

```
- id (String, PK): Unique identifier
- userId (String, FK): Owner user
- viewType (Enum): LIST | BOARD | CALENDAR | TIMELINE
- filters (JSON): Applied filters
- sorting (JSON): Sorting configuration
- createdAt (DateTime): Creation timestamp
- updatedAt (DateTime): Last update timestamp

Unique Constraint: [userId, viewType]
Indexes: userId
```

### ActivityLog

Audit trail for changes to todos.

```
- id (String, PK): Unique identifier
- todoId (String, FK): Associated todo
- userId (String, FK): User who made change
- type (Enum): CREATED | UPDATED | DELETED | COMPLETED | COMMENTED | ASSIGNED | TAGGED | STATUS_CHANGED
- changes (JSON, Nullable): { before: {...}, after: {...} }
- createdAt (DateTime): When change occurred

Indexes: todoId, userId, createdAt
```

## Prisma CLI Commands

### Generate Prisma Client

```bash
npm run db:generate
```

### Run Migrations (Development)

```bash
npm run db:migrate
```

### Deploy Migrations (Production)

```bash
npm run db:deploy
```

### Open Prisma Studio

Browse and edit data graphically:

```bash
npm run db:studio
```

Prisma Studio opens at `http://localhost:5555`

### Seed Database

```bash
npm run db:seed
```

## Development Workflow

### Creating a New Migration

1. Modify `schema.prisma`
2. Run:
   ```bash
   npm run db:migrate
   ```
3. Name your migration (e.g., "add_user_preferences")
4. Test your changes
5. Commit both schema and migration files

### Resetting Database (Development Only)

⚠️ **Warning: This deletes all data**

```bash
npx prisma migrate reset
```

This:

1. Drops the database
2. Recreates it
3. Applies all migrations
4. Runs the seed script

## Repository Layer

The `src/repositories/` directory contains data access objects for each entity:

- `UserRepository`: User CRUD and queries
- `CategoryRepository`: Category management
- `TagRepository`: Tag operations
- `TodoRepository`: Todo management with complex queries
- `SubtaskRepository`: Subtask operations
- `ReminderRepository`: Reminder management
- `ActivityLogRepository`: Activity tracking

Example usage:

```typescript
import { TodoRepository } from './repositories';

const todoRepo = new TodoRepository();

// Find todos by user
const todos = await todoRepo.findByUserId(userId);

// Find upcoming todos
const upcoming = await todoRepo.findUpcomingTodos(userId, 7);

// Add tag to todo
await todoRepo.addTag(todoId, tagId);
```

## Performance Considerations

### Indexes

The schema includes strategic indexes on frequently queried fields:

- `users`: none (small table)
- `categories`: userId
- `tags`: userId
- `todos`: userId, categoryId, status, dueDate
- `subtasks`: todoId, userId
- `attachments`: todoId, userId
- `reminders`: todoId, userId, scheduledAt
- `activity_logs`: todoId, userId, createdAt

### Relationships

All foreign keys use cascading deletes:

- Deleting a User deletes all their data
- Deleting a Todo deletes related subtasks, attachments, reminders
- Deleting a Category sets related todos' categoryId to null

### Constraints

Unique constraints prevent duplicates:

- User email must be unique
- Category names unique per user
- Tag names unique per user
- Todo-Tag combinations unique

## Backup and Recovery

### Backup Database

```bash
docker compose exec db pg_dump -U todo_user todo_platform > backup.sql
```

### Restore from Backup

```bash
docker compose exec db psql -U todo_user todo_platform < backup.sql
```

## Stopping the Database

```bash
docker compose down
```

To also remove volumes:

```bash
docker compose down -v
```

## Troubleshooting

### Connection Issues

Check environment variables and PostgreSQL is running:

```bash
docker compose ps
docker compose logs db
```

### Migration Failed

View the migration status:

```bash
npm run db:migrate -- --skip-generate
```

### Reset Dev Database

```bash
npx prisma migrate reset
```

### View Database Schema

Use Prisma Studio:

```bash
npm run db:studio
```

## References

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)
