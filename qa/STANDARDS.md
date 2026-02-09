# QA Standards Reference

Quick reference card for Support Triage QA testing. For comprehensive ISO 25010 quality checklist, see [QA-CHECKLIST.md](../QA-CHECKLIST.md).

## Build Verification

**Before any testing, verify the build passes:**

```bash
cd ui
npm run build
```

Must exit with 0 errors. Any build warnings that relate to functionality should be addressed before testing.

## Tech Stack

- **Frontend:** React 18 + Vite 5
- **Backend:** Express 5
- **Database:** SQLite via sql.js
- **Design System:** C1 design tokens (CSS variables)
- **Language:** JavaScript (no TypeScript)

## Responsive Testing Breakpoints

Test the UI at these key breakpoints:

- **Desktop:** 1024px and above (default testing size)
- **Tablet:** 900px width
- **Mobile:** 768px width (minimum supported)

All features must be functional and readable at each breakpoint. Use browser DevTools to resize or use a device testing tool.

## CSS Conventions

- **CSS Variables:** All colors, spacing, and typography must use C1 design tokens from `ui/index.css`
- **Naming Convention:** BEM-inspired (Block\_\_Element--Modifier)
  - Good: `.investigation__header`, `.investigation__header--active`
  - Avoid: `.inv-h`, `.header1`, `.header_active`
- **No Hardcoded Colors:** All colors come from CSS variables
  - Good: `color: var(--c1-text-primary);`
  - Avoid: `color: #333;`
- **Scoped Styles:** Use CSS modules or scoped approach within component files

## Component Conventions

- **Functional Components Only:** No class components
- **Hooks Only:** Use `useState`, `useEffect`, `useContext`, `useMemo`, `useCallback` as needed
- **No Class Methods:** All logic must be in hook functions
- **Props Validation:** Validate required props in component logic or with comments
- **Single Responsibility:** Each component should have one clear purpose
- **Naming:** PascalCase for components (e.g., `InvestigationTable.jsx`)

## Error Handling

### API Calls

All API calls must have error handling:

```javascript
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const data = await response.json();
  // use data
} catch (error) {
  // handle error
  console.error('Error:', error);
  // Set error state, show user message
}
```

### UI States

Every data-fetching component must handle three states:

1. **Loading State:** Show spinner, skeleton, or "Loading..." message
2. **Error State:** Display user-friendly error message (not stack trace)
3. **Empty State:** Display appropriate message when no data exists (not an error)

Example:

```javascript
if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
if (!data || data.length === 0) return <EmptyState />;
return <DataDisplay data={data} />;
```

## Database Standards

### Parameterized SQL

All SQL queries must use parameterized statements to prevent SQL injection:

- Good: `SELECT * FROM investigations WHERE id = ?`
- Avoid: `SELECT * FROM investigations WHERE id = '${id}'`

### Column Additions

When adding new columns to tables:

1. Add `DEFAULT` value in schema
2. Add migration logic in `migrateExistingDB()` function
3. Document the migration in comments

Example migration:

```javascript
if (!columns.find(col => col.name === 'new_field')) {
  db.run('ALTER TABLE table_name ADD COLUMN new_field TEXT DEFAULT ""');
}
```

### Existing Tables

Current primary tables to be aware of:

- `investigations` - Main investigation records
- `investigation_phases` - Phase progression data
- `investigation_files` - Attached files
- `investigation_checkpoints` - Checkpoint records
- `settings` - Application settings
- `feature_requests` - Feature request submissions

## API Conventions

### RESTful Endpoints

Follow REST patterns:

- `GET /api/resource` - List all
- `POST /api/resource` - Create new
- `GET /api/resource/:id` - Get one
- `PUT /api/resource/:id` - Update
- `DELETE /api/resource/:id` - Delete (if applicable)

### Error Response Format

All error responses must follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

Example:

```json
{
  "error": "Investigation not found"
}
```

### Success Response Format

- Array responses: Return array directly or with `data` wrapper
- Single object: Return the object
- Operations: Return status message or updated object

## Testing Checklist

Before marking a feature as complete:

- [ ] Build passes (`npm run build` in ui directory)
- [ ] All loading states display correctly
- [ ] All error states handle gracefully
- [ ] API calls use try-catch
- [ ] Responsive at 1024px, 900px, and 768px
- [ ] All colors use C1 CSS variables
- [ ] CSS class names follow BEM convention
- [ ] No console errors or warnings (except expected)
- [ ] Database migrations in place for new columns
- [ ] API responses follow structured format
- [ ] Tested on actual device or DevTools emulation

## Quick Links

- **Project Root QA Checklist:** See `QA-CHECKLIST.md` for full ISO 25010 testing coverage
- **This Directory:** `/sessions/vigilant-cool-johnson/mnt/support-triage/qa/`
- **Frontend:** `/sessions/vigilant-cool-johnson/mnt/support-triage/ui/`
- **Backend:** `/sessions/vigilant-cool-johnson/mnt/support-triage/`
