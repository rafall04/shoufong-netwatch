# Task Completion Rules - Error-Free Implementation

## CRITICAL: Zero-Error Policy

Before marking ANY task as complete, you MUST ensure there are NO errors in the codebase.

## Mandatory Verification Steps

### 1. Run Diagnostics Check
After implementing any code changes, you MUST:
```
- Run getDiagnostics on ALL modified files
- Check for TypeScript errors, linting errors, and type issues
- Verify that diagnostics return "No diagnostics found"
```

### 2. Fix All Errors Immediately
If diagnostics show ANY errors:
- **DO NOT** mark the task as complete
- **DO NOT** move to the next task
- **FIX** all errors immediately
- **RE-RUN** diagnostics to verify fixes
- Only proceed when diagnostics are clean

### 3. Common Error Patterns to Check

#### TypeScript Import Errors
- Missing imports (e.g., `vi` from vitest)
- Incorrect import paths
- Missing type definitions

#### Type Errors
- Incorrect type annotations
- Missing required properties
- Type mismatches

#### Linting Errors
- Unused variables
- Missing semicolons (if required by project)
- Formatting issues

## Task Completion Checklist

Before marking any task as complete, verify:

- [ ] All modified files checked with `getDiagnostics`
- [ ] Zero diagnostic errors found
- [ ] Code compiles without errors
- [ ] No red error indicators in editor
- [ ] All TypeScript types are correct

## Example Workflow

```typescript
// 1. Implement feature
// ... write code ...

// 2. Check diagnostics on ALL modified files
getDiagnostics([
  "path/to/modified/file1.ts",
  "path/to/modified/file2.tsx",
  "path/to/test/file.test.ts"
])

// 3. If errors found, fix them immediately
// ... fix errors ...

// 4. Re-check diagnostics to verify fixes
getDiagnostics([
  "path/to/modified/file1.ts",
  "path/to/modified/file2.tsx",
  "path/to/test/file.test.ts"
])

// 5. Only if diagnostics are clean (no errors), task is complete
// Task is ready - code compiles, types are correct, no errors
```

## Error Response Protocol

If you encounter errors during task completion:

1. **Acknowledge**: "I found [X] errors that need to be fixed"
2. **Fix**: Resolve each error systematically
3. **Verify**: Re-run diagnostics to confirm fixes
4. **Complete**: Only when diagnostics are clean, task is complete

## Zero Tolerance

There is **ZERO TOLERANCE** for completing tasks with errors. Every task must be:
- ✅ Error-free (verified by getDiagnostics)
- ✅ TypeScript compiles without errors
- ✅ All types are correct

## Consequences of Skipping Verification

Completing tasks with errors leads to:
- ❌ Broken builds
- ❌ Failed tests in CI/CD
- ❌ Wasted time debugging later
- ❌ Poor code quality
- ❌ User frustration

## Remember

**"Done" means "Done Right"** - not just "code written"

A task is only complete when:
1. Code is written
2. All errors are fixed (verified by getDiagnostics)
3. Diagnostics are clean (no TypeScript, linting, or type errors)
4. Code compiles successfully

**NO EXCEPTIONS.**

## Why getDiagnostics is Sufficient

Using `getDiagnostics` is the most efficient and reliable verification method because:

- ✅ **Instant feedback** - No waiting for test runners to start
- ✅ **Catches all compile errors** - TypeScript, linting, type mismatches
- ✅ **No resource leaks** - Doesn't spawn processes that can hang
- ✅ **100% reliable** - Never gets stuck or times out
- ✅ **Comprehensive** - Checks syntax, types, imports, and more

Tests can be run manually by the user when needed. Our job is to ensure the code compiles correctly and has no errors.

## CRITICAL: Do Not Run Tests

**NEVER run `npm test` or `npm run test` commands automatically.**

Reasons:
- ❌ Tests can take a very long time to complete
- ❌ Tests can timeout and block execution
- ❌ Tests can hang indefinitely
- ❌ Running tests wastes time and resources
- ❌ The user can run tests manually when they want

**Instead:**
- ✅ Use `getDiagnostics` to verify code compiles
- ✅ Let the user run tests manually when ready
- ✅ Focus on ensuring code is error-free and compiles correctly

**The ONLY verification needed is `getDiagnostics` - nothing more.**
