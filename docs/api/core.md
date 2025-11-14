# Todo Platform Core API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

Currently, authentication is placeholder-based. For all authenticated endpoints, include the following header:

```
X-User-ID: <user-id>
X-Correlation-ID: <correlation-id> (optional)
```

In production, this should be replaced with JWT token validation or session-based authentication.

## Response Format

All API responses follow a consistent envelope format:

### Success Response

```json
{
  "data": {},
  "meta": {}
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "correlationId": "correlation-id-uuid"
}
```

## Error Codes

| Status | Code                  | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| 400    | Bad Request           | Invalid request parameters or validation error |
| 401    | Unauthorized          | Missing or invalid authentication              |
| 403    | Forbidden             | Access denied to resource                      |
| 404    | Not Found             | Resource not found                             |
| 409    | Conflict              | Resource already exists or conflict detected   |
| 500    | Internal Server Error | Server error                                   |

---

## Users

### Get User Profile

Retrieve the authenticated user's profile information.

**Request:**

```
GET /users/profile
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "timezone": "UTC",
    "settings": {},
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {}
}
```

### Update User Profile

Update the authenticated user's profile information.

**Request:**

```
PATCH /users/profile
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "displayName": "Jane Doe",
  "timezone": "America/New_York",
  "settings": {
    "theme": "dark"
  }
}
```

**Response (200):**

```json
{
  "data": {
    "id": "user123",
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "timezone": "America/New_York",
    "settings": {
      "theme": "dark"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  },
  "meta": {}
}
```

---

## Todos

### Create Todo

Create a new todo.

**Request:**

```
POST /todos
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "categoryId": "category123",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2024-01-15T10:00:00Z",
  "tagIds": ["tag1", "tag2"]
}
```

**Response (201):**

```json
{
  "data": {
    "id": "todo123",
    "userId": "user123",
    "categoryId": "category123",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "TODO",
    "priority": "HIGH",
    "startDate": null,
    "dueDate": "2024-01-15T10:00:00Z",
    "reminderLeadTime": null,
    "completedAt": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {}
}
```

### Get Todo

Retrieve a specific todo by ID.

**Request:**

```
GET /todos/:todoId
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": {
    "id": "todo123",
    "userId": "user123",
    "categoryId": "category123",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "TODO",
    "priority": "HIGH",
    "startDate": null,
    "dueDate": "2024-01-15T10:00:00Z",
    "reminderLeadTime": null,
    "completedAt": null,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "category": {
      "id": "category123",
      "name": "Shopping",
      "color": "#3b82f6"
    },
    "tags": [
      {
        "id": "todotag1",
        "tag": {
          "id": "tag1",
          "name": "urgent",
          "color": "#ef4444"
        }
      }
    ],
    "subtasks": [
      {
        "id": "subtask1",
        "title": "Check milk expiry",
        "completed": false,
        "ordering": 0
      }
    ],
    "attachments": []
  },
  "meta": {}
}
```

### List Todos

List all todos with pagination, filtering, and sorting.

**Request:**

```
GET /todos?page=1&limit=20&status=TODO&priority=HIGH&categoryId=cat123&tagId=tag1&search=grocery&sortBy=dueDate&sortOrder=asc
Headers:
  X-User-ID: <user-id>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (TODO, IN_PROGRESS, DONE, CANCELLED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `categoryId` (optional): Filter by category ID
- `tagId` (optional): Filter by tag ID
- `dueDateFrom` (optional): Filter todos with due date from this date
- `dueDateTo` (optional): Filter todos with due date to this date
- `search` (optional): Search in title and description
- `sortBy` (optional): Sort by field (createdAt, dueDate, priority, title) - default: createdAt
- `sortOrder` (optional): Sort order (asc, desc) - default: desc

**Response (200):**

```json
{
  "data": [
    {
      "id": "todo123",
      "userId": "user123",
      "categoryId": "category123",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "status": "TODO",
      "priority": "HIGH",
      "startDate": null,
      "dueDate": "2024-01-15T10:00:00Z",
      "reminderLeadTime": null,
      "completedAt": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pages": 3
  }
}
```

### Update Todo

Update a specific todo.

**Request:**

```
PATCH /todos/:todoId
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "title": "Buy groceries and cook",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "dueDate": "2024-01-16T10:00:00Z"
}
```

**Response (200):**
Same as Create Todo response with updated fields.

### Delete Todo

Delete a specific todo and all its associated data (subtasks, attachments).

**Request:**

```
DELETE /todos/:todoId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

### Mark Todo Complete

Mark a todo as complete and set the completedAt timestamp.

**Request:**

```
POST /todos/:todoId/complete
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": {
    "id": "todo123",
    "status": "DONE",
    "completedAt": "2024-01-10T12:00:00Z",
    ...
  },
  "meta": {}
}
```

### Mark Todo Incomplete

Mark a todo as incomplete and clear the completedAt timestamp.

**Request:**

```
POST /todos/:todoId/incomplete
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": {
    "id": "todo123",
    "status": "TODO",
    "completedAt": null,
    ...
  },
  "meta": {}
}
```

### Duplicate Todo

Create a copy of a todo with optional subtasks and tags.

**Request:**

```
POST /todos/:todoId/duplicate
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "includeTags": true,
  "includeSubtasks": true
}
```

**Response (201):**

```json
{
  "data": {
    "id": "todo456",
    "title": "Buy groceries (copy)",
    ...
  },
  "meta": {}
}
```

### Add Tag to Todo

Associate a tag with a todo.

**Request:**

```
POST /todos/:todoId/tags/:tagId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

### Remove Tag from Todo

Remove a tag association from a todo.

**Request:**

```
DELETE /todos/:todoId/tags/:tagId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

---

## Categories

### Create Category

Create a new category.

**Request:**

```
POST /categories
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "name": "Shopping",
  "color": "#3b82f6"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "category123",
    "userId": "user123",
    "name": "Shopping",
    "color": "#3b82f6",
    "ordering": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {}
}
```

### Get Category

Retrieve a specific category.

**Request:**

```
GET /categories/:categoryId
Headers:
  X-User-ID: <user-id>
```

**Response (200):**
Same as Create Category response.

### List Categories

List all categories for the user.

**Request:**

```
GET /categories
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "category123",
      "userId": "user123",
      "name": "Shopping",
      "color": "#3b82f6",
      "ordering": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 5
  }
}
```

### Update Category

Update a category.

**Request:**

```
PATCH /categories/:categoryId
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "name": "Grocery Shopping",
  "color": "#ef4444"
}
```

**Response (200):**
Same as Create Category response with updated fields.

### Delete Category

Delete a category. Associated todos will have their categoryId set to null.

**Request:**

```
DELETE /categories/:categoryId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

### Reorder Categories

Reorder multiple categories.

**Request:**

```
POST /categories/reorder
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "ordering": [
    { "id": "category1", "ordering": 0 },
    { "id": "category2", "ordering": 1 },
    { "id": "category3", "ordering": 2 }
  ]
}
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "category1",
      "ordering": 0,
      ...
    },
    {
      "id": "category2",
      "ordering": 1,
      ...
    }
  ],
  "meta": {
    "total": 3
  }
}
```

---

## Tags

### Create Tag

Create a new tag.

**Request:**

```
POST /tags
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "name": "urgent",
  "color": "#ef4444"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "tag123",
    "userId": "user123",
    "name": "urgent",
    "color": "#ef4444"
  },
  "meta": {}
}
```

### Get Tag

Retrieve a specific tag.

**Request:**

```
GET /tags/:tagId
Headers:
  X-User-ID: <user-id>
```

**Response (200):**
Same as Create Tag response.

### List Tags

List all tags for the user.

**Request:**

```
GET /tags
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "tag123",
      "userId": "user123",
      "name": "urgent",
      "color": "#ef4444"
    }
  ],
  "meta": {
    "total": 10
  }
}
```

### Update Tag

Update a tag.

**Request:**

```
PATCH /tags/:tagId
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "name": "very urgent",
  "color": "#ff0000"
}
```

**Response (200):**
Same as Create Tag response with updated fields.

### Delete Tag

Delete a tag. All associations with todos will be removed.

**Request:**

```
DELETE /tags/:tagId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

---

## Subtasks

### Create Subtask

Create a new subtask under a todo.

**Request:**

```
POST /todos/:todoId/subtasks
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "title": "Buy milk"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "subtask123",
    "todoId": "todo123",
    "userId": "user123",
    "title": "Buy milk",
    "completed": false,
    "ordering": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {}
}
```

### Get Subtask

Retrieve a specific subtask.

**Request:**

```
GET /todos/:todoId/subtasks/:subtaskId
Headers:
  X-User-ID: <user-id>
```

**Response (200):**
Same as Create Subtask response.

### List Subtasks

List all subtasks for a todo.

**Request:**

```
GET /todos/:todoId/subtasks
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "subtask123",
      "todoId": "todo123",
      "userId": "user123",
      "title": "Buy milk",
      "completed": false,
      "ordering": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 3
  }
}
```

### Update Subtask

Update a subtask.

**Request:**

```
PATCH /todos/:todoId/subtasks/:subtaskId
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "title": "Buy 2 liters of milk",
  "completed": true,
  "ordering": 1
}
```

**Response (200):**
Same as Create Subtask response with updated fields.

### Delete Subtask

Delete a subtask.

**Request:**

```
DELETE /todos/:todoId/subtasks/:subtaskId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

### Toggle Subtask

Toggle the completion status of a subtask.

**Request:**

```
PATCH /todos/:todoId/subtasks/:subtaskId/toggle
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "completed": true
}
```

**Response (200):**

```json
{
  "data": {
    "id": "subtask123",
    "completed": true,
    ...
  },
  "meta": {}
}
```

### Reorder Subtasks

Reorder multiple subtasks.

**Request:**

```
POST /todos/:todoId/subtasks/reorder
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "ordering": [
    { "id": "subtask1", "ordering": 0 },
    { "id": "subtask2", "ordering": 1 },
    { "id": "subtask3", "ordering": 2 }
  ]
}
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "subtask1",
      "ordering": 0,
      ...
    }
  ],
  "meta": {
    "total": 3
  }
}
```

---

## Attachments

Attachment metadata is stored in the database. Actual file uploads should be handled separately through a file service.

### Create Attachment

Create an attachment metadata record.

**Request:**

```
POST /todos/:todoId/attachments
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "url": "https://storage.example.com/files/document.pdf"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "attachment123",
    "todoId": "todo123",
    "userId": "user123",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "url": "https://storage.example.com/files/document.pdf",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "meta": {}
}
```

### Get Attachment

Retrieve a specific attachment.

**Request:**

```
GET /todos/:todoId/attachments/:attachmentId
Headers:
  X-User-ID: <user-id>
```

**Response (200):**
Same as Create Attachment response.

### List Attachments

List all attachments for a todo.

**Request:**

```
GET /todos/:todoId/attachments
Headers:
  X-User-ID: <user-id>
```

**Response (200):**

```json
{
  "data": [
    {
      "id": "attachment123",
      "todoId": "todo123",
      "userId": "user123",
      "fileName": "document.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "url": "https://storage.example.com/files/document.pdf",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 2
  }
}
```

### Update Attachment

Update attachment metadata.

**Request:**

```
PATCH /todos/:todoId/attachments/:attachmentId
Headers:
  X-User-ID: <user-id>
Content-Type: application/json

{
  "fileName": "updated_document.pdf",
  "url": "https://storage.example.com/files/updated_document.pdf"
}
```

**Response (200):**
Same as Create Attachment response with updated fields.

### Delete Attachment

Delete an attachment metadata record.

**Request:**

```
DELETE /todos/:todoId/attachments/:attachmentId
Headers:
  X-User-ID: <user-id>
```

**Response (204):** No content

---

## Error Examples

### Validation Error

**Response (400):**

```json
{
  "status": "error",
  "message": "title: String must contain at least 1 character(s), priority: Invalid enum value",
  "correlationId": "correlation-123"
}
```

### Unauthorized Error

**Response (401):**

```json
{
  "status": "error",
  "message": "User ID is required",
  "correlationId": "correlation-123"
}
```

### Not Found Error

**Response (404):**

```json
{
  "status": "error",
  "message": "Todo not found",
  "correlationId": "correlation-123"
}
```

### Conflict Error

**Response (409):**

```json
{
  "status": "error",
  "message": "Category with this name already exists",
  "correlationId": "correlation-123"
}
```

---

## Implementation Notes

### Pagination

- Default page size: 20 items
- Maximum page size: 100 items
- Pages are 1-indexed

### Filtering

- Multiple filters can be combined (they work as AND conditions)
- Date filtering supports ISO 8601 format
- Search is case-insensitive and searches both title and description for todos

### Sorting

- Default sort: by createdAt descending
- Available sort fields: createdAt, dueDate, priority, title
- Sort order: asc (ascending) or desc (descending)

### Soft Deletion

Currently, all deletions are hard deletions. The system permanently removes records from the database. If soft deletion is required in the future, a `deletedAt` field should be added to the schema.

### Timestamps

- All timestamps are in ISO 8601 format with UTC timezone
- `createdAt` is set when the resource is created and never changes
- `updatedAt` is updated whenever the resource is modified
- `completedAt` is set when a todo is marked as complete, and cleared when marked incomplete
