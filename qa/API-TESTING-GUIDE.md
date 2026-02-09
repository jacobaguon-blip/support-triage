# API Testing Guide

Comprehensive guide for testing Support Triage backend APIs.

## Server Setup

### Start the Backend Server

```bash
cd /path/to/support-triage
npm install
node server.js
```

Expected output: `Server running on http://localhost:3000`

The server will initialize the SQLite database and run any migrations on startup.

### Verify Server Health

```bash
curl http://localhost:3000/api/health
```

Expected response: HTTP 200 (if health endpoint exists) or any successful endpoint

## API Endpoints Reference

All endpoints follow RESTful conventions and return JSON responses.

### Investigations

#### GET /api/investigations
**Description:** Retrieve all investigations

**Method:** GET
**URL:** `http://localhost:3000/api/investigations`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/investigations
```

**Expected Response (200):**
```json
[
  {
    "id": "inv-001",
    "ticketId": "TICKET-001",
    "phase": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "inv-002",
    "ticketId": "TICKET-002",
    "phase": 2,
    "createdAt": "2024-01-14T09:15:00Z",
    "updatedAt": "2024-01-14T09:15:00Z"
  }
]
```

**Error Cases:**
- Database error: Returns HTTP 500 with `{"error": "Database error message"}`

---

#### POST /api/investigations
**Description:** Create a new investigation with a ticket ID

**Method:** POST
**URL:** `http://localhost:3000/api/investigations`
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "ticketId": "TICKET-001"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "TICKET-001"}'
```

**Expected Response (201 or 200):**
```json
{
  "id": "inv-001",
  "ticketId": "TICKET-001",
  "phase": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Error Cases:**
- Missing ticketId: HTTP 400, `{"error": "Ticket ID is required"}`
- Duplicate ticketId: HTTP 400, `{"error": "Investigation already exists for this ticket"}`
- Database error: HTTP 500, `{"error": "Failed to create investigation"}`

**Validation:**
- ticketId: Required, non-empty string

---

#### GET /api/investigations/:id
**Description:** Retrieve a specific investigation by ID

**Method:** GET
**URL:** `http://localhost:3000/api/investigations/:id`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/investigations/inv-001
```

**Expected Response (200):**
```json
{
  "id": "inv-001",
  "ticketId": "TICKET-001",
  "phase": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "checkpoints": [
    {
      "id": "cp-001",
      "investigationId": "inv-001",
      "approved": true,
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ],
  "files": [
    {
      "id": "f-001",
      "name": "evidence.pdf",
      "uploadedAt": "2024-01-15T10:32:00Z"
    }
  ]
}
```

**Error Cases:**
- Not found: HTTP 404, `{"error": "Investigation not found"}`
- Invalid ID: HTTP 400, `{"error": "Invalid investigation ID"}`

---

### Checkpoints

#### POST /api/investigations/:id/checkpoint
**Description:** Create a checkpoint for an investigation

**Method:** POST
**URL:** `http://localhost:3000/api/investigations/:id/checkpoint`
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "notes": "Phase 1 review completed"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/investigations/inv-001/checkpoint \
  -H "Content-Type: application/json" \
  -d '{"notes": "Phase 1 review completed"}'
```

**Expected Response (201 or 200):**
```json
{
  "id": "cp-001",
  "investigationId": "inv-001",
  "notes": "Phase 1 review completed",
  "approved": false,
  "createdAt": "2024-01-15T10:35:00Z"
}
```

**Error Cases:**
- Investigation not found: HTTP 404, `{"error": "Investigation not found"}`
- Invalid notes: HTTP 400, `{"error": "Notes required"}`
- Database error: HTTP 500, `{"error": "Failed to create checkpoint"}`

---

#### PUT /api/investigations/:investigationId/checkpoint/:checkpointId
**Description:** Update checkpoint (approve/unapprove)

**Method:** PUT
**URL:** `http://localhost:3000/api/investigations/:investigationId/checkpoint/:checkpointId`
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "approved": true
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/investigations/inv-001/checkpoint/cp-001 \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'
```

**Expected Response (200):**
```json
{
  "id": "cp-001",
  "investigationId": "inv-001",
  "notes": "Phase 1 review completed",
  "approved": true,
  "createdAt": "2024-01-15T10:35:00Z",
  "updatedAt": "2024-01-15T10:45:00Z"
}
```

**Error Cases:**
- Not found: HTTP 404, `{"error": "Checkpoint not found"}`
- Invalid boolean: HTTP 400, `{"error": "Approved must be true or false"}`

---

### Files

#### GET /api/investigations/:id/files
**Description:** Get all files for an investigation

**Method:** GET
**URL:** `http://localhost:3000/api/investigations/:id/files`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/investigations/inv-001/files
```

**Expected Response (200):**
```json
[
  {
    "id": "f-001",
    "investigationId": "inv-001",
    "name": "evidence.pdf",
    "size": 245000,
    "type": "application/pdf",
    "uploadedAt": "2024-01-15T10:32:00Z"
  },
  {
    "id": "f-002",
    "investigationId": "inv-001",
    "name": "screenshot.png",
    "size": 150000,
    "type": "image/png",
    "uploadedAt": "2024-01-15T10:33:00Z"
  }
]
```

**Error Cases:**
- Investigation not found: HTTP 404, `{"error": "Investigation not found"}`
- Database error: HTTP 500, `{"error": "Failed to retrieve files"}`

---

#### DELETE /api/investigations/:investigationId/files/:fileId
**Description:** Delete a file from investigation

**Method:** DELETE
**URL:** `http://localhost:3000/api/investigations/:investigationId/files/:fileId`

**cURL Example:**
```bash
curl -X DELETE http://localhost:3000/api/investigations/inv-001/files/f-001
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "File deleted"
}
```

**Error Cases:**
- File not found: HTTP 404, `{"error": "File not found"}`
- File doesn't belong to investigation: HTTP 403, `{"error": "File does not belong to this investigation"}`

---

### Hard Reset

#### POST /api/investigations/:id/hard-reset
**Description:** Reset investigation to initial state (clears phase, checkpoints, files)

**Method:** POST
**URL:** `http://localhost:3000/api/investigations/:id/hard-reset`
**Content-Type:** `application/json`

**Request Body:**
```json
{}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/investigations/inv-001/hard-reset \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (200):**
```json
{
  "id": "inv-001",
  "ticketId": "TICKET-001",
  "phase": 1,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:50:00Z"
}
```

**Notes:**
- After reset:
  - Phase set to 1
  - All checkpoints deleted
  - All files deleted
  - UpdatedAt timestamp updated
  - Original creation time preserved

**Error Cases:**
- Investigation not found: HTTP 404, `{"error": "Investigation not found"}`
- Database error: HTTP 500, `{"error": "Failed to reset investigation"}`

---

### Settings

#### GET /api/settings
**Description:** Retrieve application settings

**Method:** GET
**URL:** `http://localhost:3000/api/settings`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/settings
```

**Expected Response (200):**
```json
{
  "viewMode": "conversation",
  "theme": "light",
  "autoSave": true,
  "notificationsEnabled": true,
  "defaultPhase": 1,
  "checkpointRequired": true
}
```

**Error Cases:**
- Database error: HTTP 500, `{"error": "Failed to retrieve settings"}`

---

#### PUT /api/settings
**Description:** Update application settings

**Method:** PUT
**URL:** `http://localhost:3000/api/settings`
**Content-Type:** `application/json`

**Request Body:** (provide only fields to update)
```json
{
  "viewMode": "classic",
  "theme": "dark",
  "autoSave": false
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"viewMode": "classic", "theme": "dark"}'
```

**Expected Response (200):**
```json
{
  "viewMode": "classic",
  "theme": "dark",
  "autoSave": false,
  "notificationsEnabled": true,
  "defaultPhase": 1,
  "checkpointRequired": true
}
```

**Valid Fields:**
- `viewMode`: "conversation" or "classic"
- `theme`: "light" or "dark"
- `autoSave`: true or false
- `notificationsEnabled`: true or false
- `defaultPhase`: integer 1+
- `checkpointRequired`: true or false

**Error Cases:**
- Invalid field: HTTP 400, `{"error": "Invalid setting field"}`
- Invalid value: HTTP 400, `{"error": "Invalid value for setting"}`
- Database error: HTTP 500, `{"error": "Failed to update settings"}`

---

### Feature Requests (New System)

#### GET /api/feature-requests
**Description:** Retrieve all feature requests

**Method:** GET
**URL:** `http://localhost:3000/api/feature-requests`

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/feature-requests
```

**Expected Response (200):**
```json
[
  {
    "id": "fr-001",
    "title": "Add dark mode",
    "description": "Users want dark mode option",
    "status": "new",
    "votes": 5,
    "createdAt": "2024-01-10T08:00:00Z"
  },
  {
    "id": "fr-002",
    "title": "Bulk operations",
    "description": "Allow bulk operations on multiple investigations",
    "status": "in-progress",
    "votes": 12,
    "createdAt": "2024-01-12T09:30:00Z"
  }
]
```

**Error Cases:**
- Database error: HTTP 500, `{"error": "Failed to retrieve feature requests"}`

---

#### POST /api/feature-requests
**Description:** Create a new feature request

**Method:** POST
**URL:** `http://localhost:3000/api/feature-requests`
**Content-Type:** `application/json`

**Request Body:**
```json
{
  "title": "Export to PDF",
  "description": "Allow exporting investigation to PDF"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/feature-requests \
  -H "Content-Type: application/json" \
  -d '{"title": "Export to PDF", "description": "Allow exporting investigation to PDF"}'
```

**Expected Response (201 or 200):**
```json
{
  "id": "fr-003",
  "title": "Export to PDF",
  "description": "Allow exporting investigation to PDF",
  "status": "new",
  "votes": 0,
  "createdAt": "2024-01-15T11:00:00Z"
}
```

**Validation:**
- `title`: Required, non-empty string, max 200 characters
- `description`: Required, non-empty string, max 1000 characters

**Error Cases:**
- Missing title or description: HTTP 400, `{"error": "Title and description are required"}`
- Title too long: HTTP 400, `{"error": "Title cannot exceed 200 characters"}`
- Database error: HTTP 500, `{"error": "Failed to create feature request"}`

---

## Response Format Standards

All successful responses follow this pattern:

**Success Response:**
```json
{
  "id": "...",
  "field1": "value",
  "field2": 123,
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp" (if applicable)
}
```

**Error Response:**
```json
{
  "error": "Human-readable error message"
}
```

**Array Response:**
```json
[
  { "id": "...", ... },
  { "id": "...", ... }
]
```

## HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, POST |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Invalid input, validation failed |
| 403 | Forbidden | Access denied (e.g., wrong resource) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database or server error |

## Error Code Reference

| Error | HTTP Code | Cause | Solution |
|-------|-----------|-------|----------|
| "Ticket ID is required" | 400 | Missing ticketId in request | Provide ticketId |
| "Investigation not found" | 404 | ID doesn't exist | Verify investigation ID |
| "Invalid investigation ID" | 400 | ID format invalid | Use valid UUID format |
| "Failed to create investigation" | 500 | Database error | Check server logs |
| "Checkpoint not found" | 404 | Checkpoint ID doesn't exist | Verify checkpoint ID |
| "File not found" | 404 | File ID doesn't exist | Verify file ID |
| "Invalid setting field" | 400 | Setting name not recognized | Use valid field names |
| "Invalid value for setting" | 400 | Setting value wrong type/range | Use correct value type |

## Testing Workflow

### 1. Test Investigation Creation

```bash
# Create investigation
curl -X POST http://localhost:3000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"ticketId": "TEST-001"}'

# Response should include id (e.g., inv-001)
# Note: copy the id for next steps
```

### 2. Test Checkpoint Creation

```bash
# Create checkpoint (replace inv-001 with actual id from step 1)
curl -X POST http://localhost:3000/api/investigations/inv-001/checkpoint \
  -H "Content-Type: application/json" \
  -d '{"notes": "Test checkpoint"}'
```

### 3. Test Settings Update

```bash
# Update settings
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"viewMode": "classic"}'

# Verify with GET
curl -X GET http://localhost:3000/api/settings
```

### 4. Test Hard Reset

```bash
# Reset investigation (replace inv-001 with actual id)
curl -X POST http://localhost:3000/api/investigations/inv-001/hard-reset \
  -H "Content-Type: application/json" \
  -d '{}'

# Verify investigation is back to phase 1
curl -X GET http://localhost:3000/api/investigations/inv-001
```

## Using Tools for API Testing

### cURL (Command Line)

cURL is built-in on most systems. Examples throughout this guide use cURL.

### Postman (GUI)

1. Download Postman from postman.com
2. Create a new request
3. Select method (GET, POST, etc.)
4. Enter URL (e.g., http://localhost:3000/api/investigations)
5. Add headers: `Content-Type: application/json`
6. Add request body (for POST/PUT)
7. Click Send
8. View response

### Browser Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Perform action in app (create investigation, etc.)
4. Network tab shows all API requests
5. Click request to see:
   - Request headers
   - Request body
   - Response body
   - Status code
   - Response time

## Database State Inspection

To inspect database state during testing:

1. **Check server logs** - server.js outputs database initialization info
2. **Use SQLite tools** - if you have sqlite3 CLI installed:

```bash
# Connect to database (location may vary)
sqlite3 support-triage.db

# List tables
.tables

# View investigations
SELECT * FROM investigations;

# View checkpoints
SELECT * FROM investigation_checkpoints;

# Exit
.quit
```

## Common Testing Scenarios

### Scenario: Full Investigation Workflow

1. Create investigation: `POST /api/investigations`
2. Get investigation: `GET /api/investigations/{id}`
3. Create checkpoint: `POST /api/investigations/{id}/checkpoint`
4. Approve checkpoint: `PUT /api/investigations/{id}/checkpoint/{cpId}`
5. Get files: `GET /api/investigations/{id}/files`
6. Update settings: `PUT /api/settings`
7. Reset: `POST /api/investigations/{id}/hard-reset`

### Scenario: Error Handling

1. Try to create investigation with no ticketId (expect 400)
2. Try to get non-existent investigation (expect 404)
3. Try to update checkpoint with invalid field (expect 400)
4. Simulate server down, verify error handling

## See Also

- STANDARDS.md - QA standards
- UI-TESTING-GUIDE.md - Frontend testing
- TEST-PLAN-TEMPLATE.md - Test documentation
- ../QA-CHECKLIST.md - Full ISO 25010 checklist
