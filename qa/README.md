# QA System

This directory contains the Quality Assurance standards and checklists for the Support Triage System.

## Purpose

Prevent bugs from reaching production by enforcing a mandatory QA process before every commit.

## Files

### PRE-COMMIT-CHECKLIST.md
**Mandatory checklist** that must be completed before committing any code. Covers:
- Build verification
- Manual testing
- Browser testing  
- Responsive testing
- Design system compliance
- API integration
- Error handling

**Start here** before every commit.

### STANDARDS.md
Quick reference guide for QA requirements. Includes:
- Minimum gates (build, render, responsive)
- Testing levels (smoke, feature, integration)
- Common failure modes to watch for
- Design system compliance rules
- Browser console checks
- QA workflow summary

**Read this** to understand quality standards.

### TEST-PLAN-TEMPLATE.md
Template for documenting comprehensive test coverage for major features. Use for:
- Complex features with many flows
- Features requiring formal sign-off
- Features affecting multiple components
- Features requiring regression testing

**Use this** for major feature releases.

## Quick Start

Before committing any code:

1. **Run build:** `cd ui && npm run build`
2. **Test in browser:** Open http://localhost:3000, navigate to your feature
3. **Check console:** F12 → Console tab, must have 0 errors
4. **Test responsive:** Resize to 900px and 768px
5. **Complete checklist:** Review `PRE-COMMIT-CHECKLIST.md`

## Three Gates

Every commit must pass:

### Gate 1: Build
```bash
cd ui && npm run build
```
Must complete with 0 errors.

### Gate 2: Render
Open in browser. Must see UI, not white screen. Console must have 0 errors.

### Gate 3: Responsive
Test at 900px and 768px. No horizontal scroll, all content accessible.

## Enforcement

**No commit without QA.** This is non-negotiable.

If a bug is found post-commit that would have been caught by this checklist, that's a process failure.

## Why This Matters

QA takes 5-10 minutes. Fixing bugs after commit takes hours or days. The ROI is obvious.

**If you didn't test it, it's broken.**
