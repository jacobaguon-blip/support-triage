# QA Checklist for New Features

> Aligned with **ISO/IEC 25010:2023** quality characteristics and **ISTQB** testing methodologies.
> Complete this checklist for every feature before marking it as shipped.

---

## How to Use

1. Copy the checklist section below into a new file named `QA-REPORT-<feature-name>.md`
2. For each item, mark: `[x]` pass, `[ ]` fail, or `[~]` partial/not applicable
3. Add notes for any fails or partials
4. All **Critical** and **High** items must pass before shipping
5. **Medium** items should pass; document exceptions with justification
6. **Low** items are recommended but not blocking

---

## 1. Functional Suitability (ISO 25010 §4.1)

### 1.1 Functional Completeness
- [ ] All acceptance criteria from the spec/plan are implemented
- [ ] Feature works end-to-end from UI trigger through backend to data persistence
- [ ] All user-facing states are handled (loading, success, error, empty)
- [ ] Feature degrades gracefully when dependencies are unavailable

### 1.2 Functional Correctness
- [ ] API endpoints return correct status codes (200, 400, 404, 500)
- [ ] Database mutations are atomic — partial writes don't leave inconsistent state
- [ ] Numerical calculations and aggregations produce accurate results
- [ ] Date/time handling is consistent (timezone, format, parsing)

### 1.3 Functional Appropriateness
- [ ] Feature solves the stated user problem without unnecessary complexity
- [ ] UI affordances match user expectations (buttons, confirmations, feedback)
- [ ] No redundant or duplicate functionality introduced

---

## 2. Reliability (ISO 25010 §4.5)

### 2.1 Error Handling
- [ ] **[Critical]** All API calls have error handling with user-visible feedback
- [ ] **[Critical]** Server endpoints wrap logic in try-catch and return structured errors
- [ ] **[High]** JSON.parse calls are wrapped in try-catch
- [ ] **[High]** File I/O operations handle missing/corrupt files gracefully
- [ ] **[Medium]** Error messages are actionable (not just "Something went wrong")
- [ ] **[Medium]** Console logging includes context (function name, IDs, timestamps)

### 2.2 Fault Tolerance
- [ ] Feature handles null/undefined inputs without crashing
- [ ] Missing database columns or tables trigger migration, not crashes
- [ ] Network timeouts and disconnections are handled
- [ ] Concurrent requests to the same endpoint don't corrupt state

### 2.3 Recoverability
- [ ] Failed operations can be retried without side effects
- [ ] Partial failures leave the system in a known state
- [ ] Database state can be recovered after a crash mid-operation

---

## 3. Performance Efficiency (ISO 25010 §4.2)

### 3.1 Time Behavior
- [ ] API responses return within 500ms for standard operations
- [ ] Polling intervals are appropriate (not too frequent, not too slow)
- [ ] No blocking synchronous operations on the main thread

### 3.2 Resource Utilization
- [ ] **[High]** Polling intervals are cleared on component unmount
- [ ] **[High]** Event listeners are cleaned up in useEffect return functions
- [ ] **[Medium]** No memory leaks from growing Maps, arrays, or closures
- [ ] **[Medium]** Large data sets are paginated or virtualized
- [ ] **[Low]** CSS animations use `transform`/`opacity` for GPU acceleration

### 3.3 Capacity
- [ ] Feature works with 0 items (empty state)
- [ ] Feature works with 1 item (boundary)
- [ ] Feature works with many items (10+, 100+)

---

## 4. Security (ISO 25010 §4.6)

### 4.1 Input Validation
- [ ] **[Critical]** SQL queries use parameterized statements (no string concatenation)
- [ ] **[High]** URL parameters are validated before use
- [ ] **[High]** Request body fields are validated (type, range, required)
- [ ] **[Medium]** parseInt uses radix parameter (`parseInt(x, 10)`)

### 4.2 Data Protection
- [ ] No sensitive data in URL query strings or logs
- [ ] File paths are validated to prevent directory traversal
- [ ] User-supplied content is escaped before rendering in HTML

---

## 5. Usability (ISO 25010 §4.4)

### 5.1 User Feedback
- [ ] **[High]** Loading states are shown during async operations
- [ ] **[High]** Error states are visible to the user (not just console.error)
- [ ] **[Medium]** Success confirmations are shown for destructive actions
- [ ] **[Medium]** Disabled states have explanatory tooltips

### 5.2 Accessibility
- [ ] **[Medium]** Interactive elements are keyboard accessible (Tab, Enter, Escape)
- [ ] **[Medium]** ARIA roles and labels are set on custom components
- [ ] **[Low]** Color is not the only means of conveying information
- [ ] **[Low]** Focus management is handled for modals and dialogs

### 5.3 Consistency
- [ ] Styling matches existing UI patterns and design tokens
- [ ] Component naming follows project conventions
- [ ] Error messages use consistent tone and format

---

## 6. Maintainability (ISO 25010 §4.7)

### 6.1 Code Quality
- [ ] No magic numbers — constants are named and documented
- [ ] No dead code or commented-out blocks
- [ ] Functions are under 50 lines; files are under 300 lines
- [ ] Consistent naming conventions (camelCase, UPPER_CASE for constants)

### 6.2 Modularity
- [ ] New logic is in dedicated files, not crammed into existing ones
- [ ] Components have single responsibility
- [ ] Shared logic is extracted into utilities or hooks

### 6.3 Testability
- [ ] **[Medium]** Key functions can be unit tested in isolation
- [ ] **[Medium]** Side effects (API calls, timers) are injectable/mockable
- [ ] **[Low]** Test files exist for new components and utilities

---

## 7. Compatibility (ISO 25010 §4.3)

### 7.1 Backward Compatibility
- [ ] **[Critical]** Existing data works without running migration scripts
- [ ] **[High]** New database columns have DEFAULT values
- [ ] **[High]** API changes are additive (no breaking changes to existing endpoints)

### 7.2 Coexistence
- [ ] Feature doesn't interfere with existing features
- [ ] Shared state (database, files) is accessed safely across features

---

## 8. Portability (ISO 25010 §4.8)

### 8.1 Build Verification
- [ ] `vite build` completes with 0 errors
- [ ] No new lint warnings introduced
- [ ] All imports resolve correctly

### 8.2 Environment Independence
- [ ] No hardcoded absolute paths
- [ ] No hardcoded port numbers in application code (only config)
- [ ] Feature works in both dev (Vite) and production (built) modes

---

## Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Developer | | | |
| QA Reviewer | | | |
| Product Owner | | | |

---

## Standards References

- [ISO/IEC 25010:2023](https://iso25000.com/en/iso-25000-standards/iso-25010) — Systems and Software Quality Requirements and Evaluation
- [ISTQB Foundation Level Syllabus](https://www.istqb.org/) — International Software Testing Qualifications Board
- [Monday.com SQA Best Practices 2026](https://monday.com/blog/rnd/software-quality-assurance/) — Modern QA methodology guide
