# Advanced Backend Features Documentation

This document describes the advanced capabilities implemented in the Todo Platform backend.

## Table of Contents

1. [Recurring Tasks](#recurring-tasks)
2. [Reminder System](#reminder-system)
3. [Full-Text Search](#full-text-search)
4. [Bulk Operations](#bulk-operations)
5. [User Preferences](#user-preferences)
6. [Analytics](#analytics)
7. [Activity Logging](#activity-logging)
8. [Background Jobs & Queue System](#background-jobs--queue-system)
9. [API Endpoints](#api-endpoints)

## Recurring Tasks

### Overview
The recurrence engine supports complex recurring patterns with flexible scheduling options.

### Supported Patterns
- **Daily**: Every N days
- **Weekly**: Every N weeks, with optional specific weekdays (MO, TU, WE, TH, FR, SA, SU)
- **Monthly**: Every N months, with optional specific days (1-31 or negative values for counting from end)
- **Yearly**: Every N years

### Recurrence Rule Schema
```typescript
{
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  interval: number,                    // Default: 1
  byWeekday?: string[],               // e.g., ['MO', 'WE', 'FR']
  byMonthDay?: number[],              // e.g., [1, 15, -1] (1st, 15th, last day)
  endDate?: Date                     // When recurrence should stop
}
```

### Behavior
- When a recurring todo is marked as complete, the system automatically creates the next occurrence
- Next occurrences are generated based on the original due date or creation date
- The system respects end dates and stops generating occurrences when reached
- Tags and categories are copied to new occurrences

## Reminder System

### Overview
A sophisticated reminder system that supports multiple channels and automatic scheduling.

### Channels
- **IN_APP**: In-app notifications
- **EMAIL**: Email notifications (stubbed for now)
- **PUSH**: Push notifications (stubbed for now)

### Automatic Reminders
- Users can set default reminder lead times in preferences
- When creating todos with due dates, reminders are automatically created
- Lead time is specified in minutes before due date

### Queue-Based Processing
- Redis-backed queue system using BullMQ
- Automatic retry with exponential backoff
- Scheduled jobs processed by background workers

### Reminder Types
1. **Manual Reminders**: User-created specific reminders
2. **Automatic Reminders**: Created based on todo due dates and user preferences
3. **Overdue Notifications**: Sent when todos become overdue

## Full-Text Search

### Overview
PostgreSQL-based full-text search with relevance ranking and advanced filtering.

### Search Capabilities
- **Title and Description Search**: Weighted search across todo content
- **Tag Search**: Search within tag names
- **Category Search**: Search within category names
- **Relevance Ranking**: Results ranked by relevance score
- **Advanced Filtering**: Filter by status, priority, dates, categories, tags

### Search Features
- **Fuzzy Matching**: Using PostgreSQL's tsvector
- **Phrase Search**: Support for quoted phrases
- **Boolean Operators**: AND, OR, NOT operations
- **Field-Specific Search**: Search in specific fields
- **Pagination**: Efficient pagination for large result sets

### Search Query Schema
```typescript
{
  q?: string,                    // Search query
  page?: number,                  // Default: 1
  limit?: number,                 // Default: 20
  filters?: {
    status?: TodoStatus,
    priority?: TodoPriority,
    categoryId?: string,
    tagIds?: string[],
    dateFrom?: Date,
    dateTo?: Date
  }
}
```

## Bulk Operations

### Overview
Atomic bulk operations with transaction safety and comprehensive error handling.

### Supported Operations
- **Update Status**: Change status for multiple todos
- **Update Priority**: Change priority for multiple todos
- **Update Due Dates**: Set or clear due dates
- **Move to Category**: Reorganize todos across categories
- **Assign Tags**: Add, remove, or replace tags
- **Delete**: Delete multiple todos
- **Combined Updates**: Update multiple fields at once

### Transaction Safety
- All operations use database transactions
- Partial failures are tracked and reported
- Rollback on critical errors
- Activity logging for all changes

### Bulk Operations Endpoints
- `PUT /api/bulk/status` - Update status
- `PUT /api/bulk/priority` - Update priority
- `PUT /api/bulk/due-date` - Update due dates
- `PUT /api/bulk/category` - Move to category
- `PUT /api/bulk/tags` - Assign tags
- `PUT /api/bulk/update` - Combined updates
- `DELETE /api/bulk/` - Delete todos

## User Preferences

### Overview
Comprehensive user preference system with defaults and intelligent defaults application.

### Preference Categories

#### UI Preferences
- `defaultView`: List, Board, Calendar, Timeline
- `theme`: light, dark, system
- `compactMode`: boolean
- `showCompletedTodos`: boolean

#### Time & Date Preferences
- `timezone`: User's timezone
- `weekStartsOn`: Day of week (0-6)
- `dateFormat`: Date format string
- `timeFormat`: 12h or 24h

#### Work Hours
- `workHoursStart`: Start time (HH:MM)
- `workHoursEnd`: End time (HH:MM)
- `workDays`: Array of day numbers (0-6)

#### Reminder Preferences
- `defaultReminderLeadTime`: Minutes before due date
- `defaultReminderChannel`: IN_APP, EMAIL, PUSH
- `enableEmailReminders`: boolean
- `enablePushReminders`: boolean

#### Notification Preferences
- `notifyOnDueDate`: boolean
- `notifyOnOverdue`: boolean
- `notifyOnAssignment`: boolean
- `notifyOnComments`: boolean

#### Default Todo Values
- `defaultPriority`: LOW, MEDIUM, HIGH, URGENT
- `defaultCategory`: Category ID
- `defaultTags`: Array of tag IDs
- `autoCreateReminders`: boolean

### Intelligent Defaults
The system automatically applies user defaults when creating todos:
- Default priority and category
- Automatic reminder creation based on preferences
- Default tags applied to new todos

## Analytics

### Overview
Comprehensive productivity analytics with SQL aggregations and trend analysis.

### Available Metrics

#### Overview Metrics
- Total todos count
- Completed todos count
- Overdue todos count
- Completion rate percentage
- Todos created this week/month/year

#### Distribution Analysis
- Todos by status
- Todos by priority
- Todos by category
- Completion trends over time

#### Productivity Metrics
- Average completion time
- Current completion streak
- Longest completion streak
- Productivity trends

### Analytics Endpoints
- `GET /api/analytics/summary` - Comprehensive analytics summary
- `GET /api/analytics/productivity` - Productivity-specific metrics

## Activity Logging

### Overview
Comprehensive audit trail for all todo-related activities.

### Activity Types
- `CREATED`: Todo creation
- `UPDATED`: General updates
- `DELETED`: Todo deletion
- `COMPLETED`: Todo completion
- `COMMENTED`: Comments added
- `ASSIGNED`: Assignment changes
- `TAGGED`: Tag modifications
- `STATUS_CHANGED`: Status updates

### Activity Data
- User ID who performed the action
- Todo ID related to the activity
- Activity type
- Before/after state changes
- Timestamp

### Activity Log Endpoints
- `GET /api/activity-logs` - Retrieve activity logs
- `POST /api/activity-logs` - Create activity log entry

## Background Jobs & Queue System

### Overview
Redis-backed queue system using BullMQ for reliable background job processing.

### Queue Types
- **Reminders Queue**: Process scheduled reminders
- **Recurrences Queue**: Handle recurring todo generation
- **Cleanup Queue**: Periodic maintenance tasks

### Job Processing
- Automatic retry with exponential backoff
- Job prioritization
- Dead letter queue for failed jobs
- Real-time monitoring and statistics

### Scheduler Service
Cron-based scheduler that:
- Checks for due reminders every minute
- Processes recurrence checks every hour
- Sends overdue notifications
- Performs cleanup operations

### Environment Configuration
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional
REDIS_URL=optional_connection_string
```

## API Endpoints

### Search Endpoints
- `GET /api/search/todos` - Full-text search with filtering
- `GET /api/search/tags` - Search tags
- `GET /api/search/categories` - Search categories

### Bulk Operations Endpoints
- `PUT /api/bulk/status` - Bulk status update
- `PUT /api/bulk/priority` - Bulk priority update
- `PUT /api/bulk/due-date` - Bulk due date update
- `PUT /api/bulk/category` - Bulk category move
- `PUT /api/bulk/tags` - Bulk tag assignment
- `PUT /api/bulk/update` - Combined bulk update
- `DELETE /api/bulk/` - Bulk delete

### Recurrence Endpoints
- `POST /api/recurrence/rules` - Create recurrence rule
- `GET /api/recurrence/rules/:id` - Get recurrence rule
- `PUT /api/recurrence/rules/:id` - Update recurrence rule
- `DELETE /api/recurrence/rules/:id` - Delete recurrence rule
- `GET /api/recurrence/rules/:id/occurrences` - Generate next occurrences

### Reminder Endpoints
- `POST /api/reminders` - Create reminder
- `GET /api/reminders/:id` - Get reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `GET /api/reminders/todo/:todoId` - Get todo reminders
- `GET /api/reminders/upcoming` - Get upcoming reminders

### User Preferences Endpoints
- `GET /api/user-preferences` - Get user preferences
- `PUT /api/user-preferences` - Update user preferences
- `GET /api/user-preferences/defaults` - Get default todo values
- `GET /api/user-preferences/views/:viewType` - Get view preferences
- `PUT /api/user-preferences/views/:viewType` - Update view preferences

### Analytics Endpoints
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/analytics/productivity` - Productivity metrics
- `GET /api/analytics/trends` - Trend analysis

### Activity Log Endpoints
- `GET /api/activity-logs` - Get activity logs
- `GET /api/activity-logs/todo/:todoId` - Get todo activity logs

## Infrastructure Requirements

### Database
- PostgreSQL 12+ with full-text search support
- Required extensions: `pg_trgm` for fuzzy search

### Redis
- Redis 6+ for queue system
- Persistent storage recommended
- Memory requirements based on queue size

### Environment Variables
See the [Environment Configuration](#environment-configuration) section above.

## Performance Considerations

### Search Performance
- Indexed search vectors for fast full-text search
- Pagination to limit result sets
- Query optimization for large datasets

### Queue Performance
- Job batching for bulk operations
- Concurrent worker processes
- Redis memory management

### Database Performance
- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization for analytics

## Security Considerations

### Input Validation
- All inputs validated using Zod schemas
- SQL injection prevention with parameterized queries
- Rate limiting on bulk operations

### Access Control
- User-scoped data access
- Permission checks on all operations
- Audit logging for security events

## Monitoring and Observability

### Queue Monitoring
- Real-time queue statistics
- Job failure monitoring
- Performance metrics

### Application Monitoring
- Structured logging
- Error tracking
- Performance metrics

### Database Monitoring
- Query performance
- Connection pool health
- Index usage statistics