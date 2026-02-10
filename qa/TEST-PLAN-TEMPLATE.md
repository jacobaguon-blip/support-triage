# Test Plan: [Feature Name]

**Feature:** [Brief description]
**Date:** [YYYY-MM-DD]
**Tester:** [Name/Role]
**Status:** [Draft | In Progress | Completed]

---

## Test Scope

### In Scope
- [What will be tested]
- [What will be tested]

### Out of Scope
- [What won't be tested and why]

---

## Test Environment

- **Frontend:** Vite dev server on localhost:3000
- **Backend:** Express on localhost:3001
- **Database:** SQLite `triage.db`
- **Browser:** Chrome/Arc [version]
- **Screen sizes:** 1920px, 900px, 768px

---

## Test Cases

### 1. [Test Case Name]

**Objective:** [What this test verifies]

**Prerequisites:**
- [Setup step]
- [Setup step]

**Steps:**
1. [Action]
2. [Action]
3. [Action]

**Expected Result:**
- [What should happen]

**Actual Result:**
- [ ] ✅ Pass
- [ ] ❌ Fail: [Description of failure]

---

## Responsive Testing

### Desktop (1920px)
- [ ] Layout uses available space well
- [ ] No awkward gaps or stretching

### Tablet (900px)
- [ ] Layout compresses gracefully
- [ ] No horizontal scroll

### Mobile (768px)
- [ ] Layout stacks vertically
- [ ] Touch targets are large enough (44px+)

---

## Sign-Off

- [ ] All critical test cases passed
- [ ] All issues documented
- [ ] Feature meets acceptance criteria
- [ ] Ready for commit

**Tester Signature:** [Name]
**Date:** [YYYY-MM-DD]
