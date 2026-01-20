---
inclusion: always
---

# Documentation Rules - Clean Code Policy

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Active - Mandatory

---

## CRITICAL PRINCIPLE

**"Code is the documentation. Comments explain WHY, not WHAT."**

---

## I. FORBIDDEN DOCUMENTATION FILES

### NO Markdown Documentation Files in Root or Subdirectories

**STRICTLY FORBIDDEN:**
- ❌ README.md files (except root README.md for project overview)
- ❌ CHANGELOG.md
- ❌ CONTRIBUTING.md
- ❌ Feature documentation files (e.g., NETWATCH_CONFIGURATION.md)
- ❌ Implementation documentation (e.g., LAYOUT_DELETE_MOBILE.md)
- ❌ Setup guides (e.g., SETUP_STATUS.md)
- ❌ Any other .md files outside `.kiro/steering/`

**ONLY ALLOWED:**
- ✅ Root `README.md` - Project overview, installation, basic usage only
- ✅ `.kiro/steering/*.md` - Development rules and steering files only

---

## II. WHY NO DOCUMENTATION FILES?

### 1. Code Should Be Self-Documenting
```typescript
// ❌ BAD: Need external documentation
// See NETWATCH_CONFIGURATION.md for details
const timeout = 1000

// ✅ GOOD: Self-documenting code
const NETWATCH_DEFAULT_TIMEOUT_MS = 1000
const NETWATCH_DEFAULT_INTERVAL_SECONDS = 5
```

### 2. Documentation Gets Outdated
- Code changes, documentation doesn't
- Creates confusion and technical debt
- Wastes time maintaining two sources of truth

### 3. Clean Repository
- Less clutter
- Easier navigation
- Focus on code, not docs

### 4. Code Comments Are Sufficient
```typescript
// ✅ GOOD: Inline comments explain WHY
// Retry connection because MikroTik API can be unstable
await retryConnection(3)

// ✅ GOOD: JSDoc for complex functions
/**
 * Syncs device to MikroTik netwatch with custom configuration
 * @param device - Device with netwatch settings
 * @returns Success status and any warnings
 */
async function syncDeviceToMikroTik(device: Device) {
  // Implementation
}
```

---

## III. WHERE TO DOCUMENT

### 1. Code Comments (Inline)
```typescript
// Use inline comments for:
// - Complex logic explanation
// - WHY decisions were made
// - Workarounds and their reasons
// - Important constraints

// Example:
// Use 5-second interval to balance between responsiveness and API load
const DEFAULT_INTERVAL = 5
```

### 2. JSDoc Comments (Functions/Classes)
```typescript
/**
 * Calculates device uptime percentage over a period
 * 
 * @param upMinutes - Total minutes device was UP
 * @param totalMinutes - Total minutes in measurement period
 * @returns Uptime percentage (0-100)
 * 
 * @example
 * calculateUptime(1440, 1440) // Returns 100 (24h up / 24h total)
 * calculateUptime(720, 1440)  // Returns 50 (12h up / 24h total)
 */
function calculateUptime(upMinutes: number, totalMinutes: number): number {
  if (totalMinutes === 0) return 0
  return (upMinutes / totalMinutes) * 100
}
```

### 3. Type Definitions (Self-Documenting)
```typescript
// ✅ GOOD: Types document the structure
interface NetwatchConfig {
  /** Timeout in milliseconds (100-10000) */
  timeout: number
  
  /** Check interval in seconds (5-3600) */
  interval: number
  
  /** Protocol type for health check */
  type: 'icmp' | 'tcp' | 'http'
  
  /** Port number for TCP/HTTP checks (optional) */
  port?: number
  
  /** Script to run when device comes UP (optional) */
  upScript?: string
  
  /** Script to run when device goes DOWN (optional) */
  downScript?: string
}
```

### 4. Root README.md Only
```markdown
# Project Name

Brief description (1-2 sentences)

## Installation
```bash
npm install
npx prisma migrate dev
npm run dev
```

## Environment Variables
```env
DATABASE_URL=
NEXTAUTH_SECRET=
```

## Tech Stack
- Next.js 14
- TypeScript
- Prisma
- PostgreSQL

That's it. No more.
```

### 5. Steering Rules (`.kiro/steering/`)
- Development standards
- Best practices
- Project-specific patterns
- Architecture decisions

---

## IV. MANDATORY ACTIONS

### When Creating New Features

**DO:**
1. ✅ Write self-documenting code
2. ✅ Add inline comments for complex logic
3. ✅ Use JSDoc for public functions
4. ✅ Create descriptive type definitions
5. ✅ Update steering rules if needed

**DON'T:**
1. ❌ Create feature documentation files
2. ❌ Create setup guides
3. ❌ Create implementation notes
4. ❌ Create changelog files
5. ❌ Create any .md files outside `.kiro/steering/`

### When Completing Tasks

**DO:**
1. ✅ Ensure code is self-documenting
2. ✅ Add necessary inline comments
3. ✅ Update root README.md if installation changes
4. ✅ Update steering rules if patterns change

**DON'T:**
1. ❌ Create summary documentation files
2. ❌ Create task completion reports
3. ❌ Create feature documentation
4. ❌ Create any temporary .md files

---

## V. CLEANUP PROTOCOL

### Existing Documentation Files to Remove

**Immediately delete these files:**
- `NETWATCH_CONFIGURATION.md`
- `LAYOUT_DELETE_MOBILE.md`
- `SETUP_STATUS.md`
- Any other .md files in root or subdirectories (except README.md)

**Keep only:**
- `README.md` (root)
- `.kiro/steering/*.md` (rules only)

### Command to Find Unwanted Documentation
```bash
# Find all .md files except allowed ones
find . -name "*.md" -not -path "./.kiro/steering/*" -not -name "README.md" -not -path "./node_modules/*"
```

---

## VI. ENFORCEMENT

### Pre-Commit Check
```bash
# Add to git hooks or CI/CD
UNWANTED_DOCS=$(find . -name "*.md" -not -path "./.kiro/steering/*" -not -name "README.md" -not -path "./node_modules/*" -not -path "./.next/*")

if [ ! -z "$UNWANTED_DOCS" ]; then
  echo "ERROR: Unwanted documentation files found:"
  echo "$UNWANTED_DOCS"
  echo "Remove these files. Code should be self-documenting."
  exit 1
fi
```

### Code Review Checklist
- [ ] No new .md files outside `.kiro/steering/`
- [ ] Code is self-documenting
- [ ] Complex logic has inline comments
- [ ] Public functions have JSDoc
- [ ] Types are well-defined

---

## VII. EXCEPTIONS

### Only These Documentation Files Are Allowed

1. **Root README.md**
   - Project overview
   - Installation instructions
   - Environment variables
   - Tech stack
   - Maximum 100 lines

2. **`.kiro/steering/*.md`**
   - Development rules
   - Best practices
   - Architecture patterns
   - Coding standards

**NO OTHER EXCEPTIONS.**

---

## VIII. MIGRATION GUIDE

### For Existing Documentation

If you have existing documentation files:

1. **Extract Important Information**
   - Move to inline code comments
   - Move to JSDoc comments
   - Move to type definitions
   - Move to steering rules (if general pattern)

2. **Delete the Documentation File**
   - No need to keep it
   - Code is the source of truth

3. **Update Root README.md (if needed)**
   - Only if installation/setup changed
   - Keep it minimal

### Example Migration

**Before (NETWATCH_CONFIGURATION.md):**
```markdown
# Netwatch Configuration

Devices can be configured with custom netwatch settings:
- timeout: 1000ms default
- interval: 5s default
...
```

**After (in code):**
```typescript
// prisma/schema.prisma
model Device {
  // Netwatch timeout in milliseconds (default: 1000ms)
  netwatchTimeout Int @default(1000)
  
  // Netwatch check interval in seconds (default: 5s)
  netwatchInterval Int @default(5)
  
  // ... other fields
}

// components/DeviceForm.tsx
/**
 * Netwatch configuration section
 * Allows customizing timeout (100-10000ms) and interval (5-3600s)
 */
<div className="space-y-4">
  <h3>Advanced Netwatch Configuration</h3>
  {/* Form fields */}
</div>
```

**Delete:** `NETWATCH_CONFIGURATION.md`

---

## IX. BENEFITS

### Clean Repository
- ✅ Only code and rules
- ✅ Easy to navigate
- ✅ No outdated docs
- ✅ Professional appearance

### Single Source of Truth
- ✅ Code is always up-to-date
- ✅ No sync issues
- ✅ Less maintenance
- ✅ Faster development

### Better Code Quality
- ✅ Forces self-documenting code
- ✅ Encourages good naming
- ✅ Promotes clear structure
- ✅ Reduces technical debt

---

## X. REMEMBER

**"If you need a separate document to explain your code, your code is not clear enough."**

Write code that:
- ✅ Has descriptive names
- ✅ Has clear structure
- ✅ Has inline comments for WHY
- ✅ Has JSDoc for public APIs
- ✅ Has well-defined types

**NO DOCUMENTATION FILES. CODE IS THE DOCUMENTATION.**

---

## XI. QUICK REFERENCE

### Allowed Files
```
✅ README.md (root only)
✅ .kiro/steering/*.md (rules only)
```

### Forbidden Files
```
❌ Any other .md files
❌ CHANGELOG.md
❌ CONTRIBUTING.md
❌ docs/*.md
❌ Feature documentation
❌ Setup guides
❌ Implementation notes
```

### Where to Document
```
✅ Inline comments (WHY, not WHAT)
✅ JSDoc comments (public functions)
✅ Type definitions (structure)
✅ Steering rules (patterns)
```

---

**END OF DOCUMENTATION RULES**

*Follow this rule religiously. Clean code = No documentation files.*
