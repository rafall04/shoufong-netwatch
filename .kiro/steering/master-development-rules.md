---
inclusion: always
---

# Master Development Rules - MikroTik Dashboard
## Complete Guide for Clean, Efficient, and Maintainable Code

**Version:** 3.0  
**Last Updated:** January 19, 2026  
**Status:** Active - All developers must follow

---

## 🎯 CORE PRINCIPLES

### The Four Pillars
1. **ELEGANT** - Beautiful, professional, and intuitive
2. **EFFICIENT** - Fast, responsive, and optimized
3. **LIGHTWEIGHT** - Minimal resources, maximum performance
4. **UNIVERSAL** - Works flawlessly on all devices

### Golden Rules
- **NO EXCEPTIONS** - Rules are absolute
- **NO COMPROMISES** - Quality over speed
- **NO SHORTCUTS** - Do it right the first time
- **NO TECHNICAL DEBT** - Clean code always

---

## 📋 TABLE OF CONTENTS

1. [Code Quality Standards](#code-quality-standards)
2. [TypeScript Best Practices](#typescript-best-practices)
3. [React & Next.js Patterns](#react--nextjs-patterns)
4. [UI/UX Design System](#uiux-design-system)
5. [Responsive Design](#responsive-design)
6. [Performance Optimization](#performance-optimization)
7. [Accessibility (a11y)](#accessibility-a11y)
8. [Testing & Validation](#testing--validation)
9. [API Design](#api-design)
10. [Database & Prisma](#database--prisma)
11. [Security](#security)
12. [Error Handling](#error-handling)
13. [Git & Version Control](#git--version-control)
14. [Documentation](#documentation)

---

## 1. CODE QUALITY STANDARDS

### File Organization
```
app/
├── dashboard/
│   ├── [feature]/
│   │   ├── page.tsx          # Main page component
│   │   └── loading.tsx       # Loading state
│   └── layout.tsx            # Shared layout
components/
├── [ComponentName].tsx       # PascalCase for components
lib/
├── [utility].ts              # camelCase for utilities
```

### Naming Conventions
```typescript
// Components: PascalCase
export default function UserProfile() {}

// Functions: camelCase
function calculateTotal() {}

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3

// Interfaces/Types: PascalCase with descriptive names
interface UserProfileProps {}
type DeviceStatus = 'up' | 'down' | 'unknown'

// Files: kebab-case for non-components
// user-utils.ts, device-helpers.ts
```

### Code Structure
```typescript
// 1. Imports (grouped and sorted)
import React from 'react'                    // React
import { useSession } from 'next-auth/react' // External libraries
import { User } from '@/types'               // Internal types
import { Button } from '@/components'        // Internal components
import { formatDate } from '@/lib/utils'     // Internal utilities

// 2. Types/Interfaces
interface ComponentProps {
  // Props definition
}

// 3. Component
export default function Component({ props }: ComponentProps) {
  // 4. Hooks (in order)
  const session = useSession()
  const [state, setState] = useState()
  const router = useRouter()
  
  // 5. Derived state
  const computed = useMemo(() => {}, [deps])
  
  // 6. Effects
  useEffect(() => {}, [deps])
  
  // 7. Event handlers
  const handleClick = useCallback(() => {}, [deps])
  
  // 8. Early returns
  if (loading) return <Loading />
  
  // 9. Render
  return <div>...</div>
}
```

### Clean Code Principles
```typescript
// ✅ GOOD: Descriptive names
const activeUserCount = users.filter(u => u.isActive).length

// ❌ BAD: Cryptic names
const x = users.filter(u => u.a).length

// ✅ GOOD: Single responsibility
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// ❌ BAD: Multiple responsibilities
function validateAndSendEmail(email: string) {
  if (isValid(email)) {
    sendEmail(email)
  }
}

// ✅ GOOD: Small functions (< 20 lines)
function calculateDiscount(price: number, percentage: number): number {
  return price * (percentage / 100)
}

// ✅ GOOD: Avoid magic numbers
const POLLING_INTERVAL_MS = 5000
setInterval(poll, POLLING_INTERVAL_MS)

// ❌ BAD: Magic numbers
setInterval(poll, 5000)
```

---

## 2. TYPESCRIPT BEST PRACTICES

### Type Safety
```typescript
// ✅ GOOD: Explicit types
interface User {
  id: string
  name: string
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER'
  createdAt: Date
}

// ❌ BAD: Using 'any'
const user: any = {}

// ✅ GOOD: Type guards
function isAdmin(user: User): user is User & { role: 'ADMIN' } {
  return user.role === 'ADMIN'
}

// ✅ GOOD: Utility types
type PartialUser = Partial<User>
type RequiredUser = Required<User>
type UserWithoutId = Omit<User, 'id'>
type UserRole = Pick<User, 'role'>

// ✅ GOOD: Discriminated unions
type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string }
```

### Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 3. REACT & NEXT.JS PATTERNS

### Component Patterns
```typescript
// ✅ GOOD: Functional components with TypeScript
interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  'aria-label'?: string
  title?: string
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  'aria-label': ariaLabel,
  title
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  )
}

// ✅ GOOD: Memoization for expensive components
export default React.memo(ExpensiveComponent)

// ✅ GOOD: Custom hooks with SWR
function useDevices() {
  const { data, error, mutate } = useSWR('/api/devices', fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 2000
  })
  
  return {
    devices: data?.devices ?? [],
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}

// ✅ GOOD: Click outside handler
function useClickOutside(ref: React.RefObject<HTMLElement>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}
```

### Performance Optimization
```typescript
// ✅ GOOD: useCallback for event handlers
const handleClick = useCallback(() => {
  console.log('Clicked')
}, [])

// ✅ GOOD: useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name))
}, [users])

// ✅ GOOD: Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// ✅ GOOD: Code splitting by route (Next.js automatic)
// app/dashboard/users/page.tsx
// app/dashboard/devices/page.tsx
```

### Data Fetching
```typescript
// ✅ GOOD: SWR for client-side fetching
const { data, error, mutate } = useSWR('/api/devices', fetcher, {
  refreshInterval: 5000,
  revalidateOnFocus: true,
  dedupingInterval: 2000
})

// ✅ GOOD: Server components for initial data
// app/dashboard/devices/page.tsx
export default async function DevicesPage() {
  const devices = await prisma.device.findMany()
  return <DeviceList devices={devices} />
}

// ✅ GOOD: Error boundaries
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}
```

---

## 4. UI/UX DESIGN SYSTEM

### Color Palette (Strict)
```css
/* Primary Colors */
--blue-600: #2563eb    /* Primary actions */
--blue-700: #1d4ed8    /* Primary hover */

/* Status Colors */
--green-500: #10b981   /* Success/UP */
--red-500: #ef4444     /* Error/DOWN */
--yellow-500: #eab308  /* Warning */
--gray-500: #6b7280    /* Unknown */

/* Neutral Colors */
--gray-50: #f9fafb     /* Background */
--gray-100: #f3f4f6    /* Subtle background */
--gray-200: #e5e7eb    /* Borders */
--gray-700: #374151    /* Text secondary */
--gray-900: #111827    /* Text primary */
```

### Typography Scale
```tsx
// Headings (Responsive)
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
<h2 className="text-xl md:text-2xl font-semibold">
<h3 className="text-lg md:text-xl font-semibold">

// Body Text
<p className="text-sm md:text-base">      // 14px -> 16px
<span className="text-xs md:text-sm">    // 12px -> 14px
<span className="text-[10px] md:text-xs"> // 10px -> 12px
```

### Spacing System (4px base)
```tsx
// Padding
p-2  // 8px
p-4  // 16px
p-6  // 24px
p-8  // 32px

// Margin
m-2  // 8px
m-4  // 16px
m-6  // 24px
m-8  // 32px

// Gap
gap-2  // 8px
gap-4  // 16px
gap-6  // 24px
```

### Component Library
```tsx
// Primary Button
<button className="
  px-4 md:px-6 py-2.5 
  bg-gradient-to-r from-blue-600 to-blue-700 
  hover:from-blue-700 hover:to-blue-800 
  text-white rounded-lg font-medium 
  transition-all duration-200 
  shadow-md hover:shadow-lg 
  transform hover:scale-105
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Button Text
</button>

// Input Field
<input className="
  w-full px-3 py-2 
  border border-gray-300 rounded-lg 
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:cursor-not-allowed
  transition-colors
" />

// Card
<div className="
  bg-white border rounded-lg 
  p-4 md:p-6 
  hover:shadow-md transition-shadow
">
  Content
</div>
```

---

## 5. RESPONSIVE DESIGN

### Breakpoints (Tailwind)
```
Mobile:    < 640px   (sm)
Tablet:    640-767px (sm-md)
Desktop:   768px+    (md+)
Large:     1024px+   (lg+)
XL:        1280px+   (xl+)
```

### Mobile-First Approach
```tsx
// ✅ GOOD: Mobile first, then enhance
<div className="
  w-full          // Mobile: full width
  md:w-64         // Desktop: fixed width
  p-4             // Mobile: 16px padding
  md:p-6          // Desktop: 24px padding
">

// ✅ GOOD: Responsive grid
<div className="
  grid 
  grid-cols-1           // Mobile: 1 column
  sm:grid-cols-2        // Tablet: 2 columns
  lg:grid-cols-3        // Desktop: 3 columns
  xl:grid-cols-4        // Large: 4 columns
  gap-4
">

// ✅ GOOD: Hide/show based on screen size
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Touch Targets
```tsx
// ✅ GOOD: Minimum 40x40px for touch
<button className="w-10 h-10 md:w-8 md:h-8">
  <Icon className="w-5 h-5 md:w-4 md:h-4" />
</button>
```

---

## 6. PERFORMANCE OPTIMIZATION

### Image Optimization
```tsx
// ✅ GOOD: Next.js Image component
import Image from 'next/image'

<Image
  src="/device-icon.png"
  alt="Device Icon"
  width={32}
  height={32}
  loading="lazy"
/>
```

### Bundle Size
```typescript
// ✅ GOOD: Dynamic imports
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false
})

// ✅ GOOD: Tree shaking
import { Button } from '@/components/Button' // Not from index
```

### Rendering Performance
```typescript
// ✅ GOOD: Virtualization for long lists
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={1000}
  itemSize={50}
>
  {Row}
</FixedSizeList>

// ✅ GOOD: Debounce expensive operations
const debouncedSearch = useMemo(
  () => debounce((value) => search(value), 300),
  []
)
```

### Metrics to Monitor
- **FCP** (First Contentful Paint): < 1.8s
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTI** (Time to Interactive): < 3.8s

---

## 7. ACCESSIBILITY (a11y)

### WCAG 2.1 Level AA Compliance
```tsx
// ✅ GOOD: Semantic HTML
<button>Click me</button>  // Not <div onClick>

// ✅ GOOD: ARIA labels
<button aria-label="Close dialog" title="Close">
  <X className="w-4 h-4" />
</button>

// ✅ GOOD: Keyboard navigation
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  onClick={handleClick}
>

// ✅ GOOD: Focus management
<input
  ref={inputRef}
  onFocus={() => setFocused(true)}
  className="focus:ring-2 focus:ring-blue-500"
/>

// ✅ GOOD: Color contrast (4.5:1 minimum)
<p className="text-gray-900">High contrast text</p>

// ✅ GOOD: Alt text for images
<img src="device.png" alt="Router device icon" />

// ✅ GOOD: Form labels
<label htmlFor="email">Email Address</label>
<input id="email" type="email" />
```

---

## 8. TESTING & VALIDATION

### Testing Strategy
```typescript
// Unit Tests: Vitest
describe('calculateDiscount', () => {
  it('should calculate 10% discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(10)
  })
})

// Component Tests: React Testing Library
import { render, screen } from '@testing-library/react'

test('renders button with text', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})

// Integration Tests
test('user can login', async () => {
  render(<LoginPage />)
  await userEvent.type(screen.getByLabelText('Username'), 'admin')
  await userEvent.type(screen.getByLabelText('Password'), 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  expect(await screen.findByText('Dashboard')).toBeInTheDocument()
})
```

### Validation Before Deployment
```bash
# 1. TypeScript check
npm run type-check

# 2. Linting
npm run lint

# 3. Tests
npm run test

# 4. Build
npm run build

# 5. Diagnostics (Kiro)
getDiagnostics([...all-modified-files])
```

---

## 9. API DESIGN

### RESTful Conventions
```typescript
// ✅ GOOD: RESTful routes
GET    /api/devices           // List all
GET    /api/devices/:id       // Get one
POST   /api/devices           // Create
PUT    /api/devices/:id       // Update
DELETE /api/devices/:id       // Delete

// ✅ GOOD: Consistent response format
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  warning?: string
}

// ✅ GOOD: Error handling
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const data = await fetchData()
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Authentication & Authorization
```typescript
// ✅ GOOD: Check auth and role
const session = await auth()

if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## 10. DATABASE & PRISMA

### Schema Design
```prisma
// ✅ GOOD: Clear relationships
model User {
  id        String   @id @default(cuid())
  username  String   @unique
  name      String
  role      Role     @default(VIEWER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Device {
  id         String   @id @default(cuid())
  name       String
  ip         String   @unique
  status     String   @default("unknown")
  roomId     String?
  room       Room?    @relation(fields: [roomId], references: [id])
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([status])
  @@index([roomId])
}
```

### Query Optimization
```typescript
// ✅ GOOD: Include relations
const devices = await prisma.device.findMany({
  include: {
    room: true
  }
})

// ✅ GOOD: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    role: true
  }
})

// ✅ GOOD: Pagination
const devices = await prisma.device.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
})
```

### Migrations
```bash
# Create migration
npx prisma migrate dev --name add_room_field

# Generate client
npx prisma generate

# Wait for TypeScript to pick up changes
sleep 5
```

---

## 11. SECURITY

### Input Validation
```typescript
// ✅ GOOD: Validate all inputs
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateIP(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)
}

// ✅ GOOD: Sanitize user input
import { escape } from 'validator'
const sanitized = escape(userInput)
```

### Password Security
```typescript
// ✅ GOOD: Hash passwords
import bcrypt from 'bcryptjs'

const hashedPassword = await bcrypt.hash(password, 10)
const isValid = await bcrypt.compare(password, hashedPassword)
```

### Environment Variables
```typescript
// ✅ GOOD: Never commit secrets
// .env (gitignored)
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."

// ✅ GOOD: Validate env vars
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}
```

---

## 12. ERROR HANDLING

### Client-Side
```typescript
// ✅ GOOD: Try-catch with user feedback
try {
  const res = await fetch('/api/devices')
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Request failed')
  }
  const data = await res.json()
  setDevices(data.devices)
} catch (error) {
  console.error('Error:', error)
  setMessage({
    type: 'error',
    text: error instanceof Error ? error.message : 'Unknown error'
  })
}
```

### Server-Side
```typescript
// ✅ GOOD: Structured error responses
try {
  // Operation
} catch (error) {
  console.error('Operation failed:', error)
  
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Record already exists' },
        { status: 409 }
      )
    }
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

---

## 13. GIT & VERSION CONTROL

### Commit Messages
```bash
# Format: <type>(<scope>): <subject>

feat(devices): add room assignment feature
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): simplify device endpoint logic
test(devices): add unit tests for validation
chore(deps): update dependencies
```

### Branch Strategy
```bash
main          # Production-ready code
develop       # Integration branch
feature/*     # New features
fix/*         # Bug fixes
hotfix/*      # Urgent production fixes
```

### Pull Request Checklist
- [ ] Code follows style guide
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] Diagnostics clean
- [ ] Documentation updated
- [ ] Reviewed by peer

---

## 14. DOCUMENTATION

### Code Comments
```typescript
// ✅ GOOD: Explain WHY, not WHAT
// Retry connection because MikroTik API can be unstable
await retryConnection(3)

// ❌ BAD: Obvious comments
// Increment counter
counter++

// ✅ GOOD: JSDoc for functions
/**
 * Calculates device uptime percentage
 * @param upMinutes - Minutes device was up
 * @param totalMinutes - Total minutes in period
 * @returns Uptime percentage (0-100)
 */
function calculateUptime(upMinutes: number, totalMinutes: number): number {
  return (upMinutes / totalMinutes) * 100
}
```

### README Structure
```markdown
# Project Name

## Overview
Brief description

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

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

## Project Structure
```
app/          # Next.js app directory
components/   # React components
lib/          # Utilities
prisma/       # Database schema
```

## Contributing
See CONTRIBUTING.md
```

---

## 15. PROJECT-SPECIFIC PATTERNS

### Device Management
```typescript
// ✅ GOOD: Device type enum
type DeviceType = 'ROUTER' | 'TABLET' | 'SCANNER_GTEX' | 'SMART_TV'

// ✅ GOOD: Device interface with all fields
interface Device {
  id: string
  name: string
  ip: string
  type: DeviceType
  laneName: string
  status: 'up' | 'down' | 'unknown'
  positionX: number
  positionY: number
  lastSeen: string | null
  statusSince: string | null
  roomId: string | null
  room?: Room | null
}

// ✅ GOOD: Status checking
function getDeviceStatusColor(status: string): string {
  switch (status) {
    case 'up':
      return 'border-green-500'
    case 'down':
      return 'border-red-500'
    default:
      return 'border-gray-500'
  }
}
```

### Date Formatting (Indonesian)
```typescript
// ✅ GOOD: Indonesian date format
function formatIndonesianDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day} ${month}, ${hours}:${minutes}`
}
```

### Role-Based Access Control
```typescript
// ✅ GOOD: Role checking
type UserRole = 'ADMIN' | 'OPERATOR' | 'VIEWER'

function canEdit(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'OPERATOR'
}

function canManageUsers(role: UserRole): boolean {
  return role === 'ADMIN'
}

// ✅ GOOD: Conditional rendering based on role
{session?.user?.role !== 'VIEWER' && (
  <button onClick={handleEdit}>Edit</button>
)}

// ✅ GOOD: ReactFlow permissions
<ReactFlow
  nodesDraggable={session?.user?.role !== 'VIEWER'}
  nodesConnectable={false}
  elementsSelectable={session?.user?.role !== 'VIEWER'}
>
```

### Map Panel Positioning
```typescript
// ✅ GOOD: Calculate panel positions to avoid overlap
const PANEL_POSITIONS = {
  CONTROLS: 0,
  FULLSCREEN: 120,
  SEARCH_BUTTON: 160,
  SEARCH_PANEL: 200,
  LEGEND_BUTTON: 0, // bottom-left
  LEGEND_PANEL: 48, // marginBottom
  STATUS_PANEL_MOBILE: 56, // below hamburger
  STATUS_PANEL_DESKTOP: 0
}

// ✅ GOOD: Responsive panel positioning
<Panel 
  position="top-left" 
  className="bg-white rounded shadow-sm"
  style={{ marginTop: `${PANEL_POSITIONS.SEARCH_BUTTON}px` }}
>
```

### Click Outside Handler
```typescript
// ✅ GOOD: Reusable click outside hook
function useClickOutside(
  ref: React.RefObject<HTMLElement>, 
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }
    
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// Usage
const panelRef = useRef<HTMLDivElement>(null)
useClickOutside(panelRef, () => setShowPanel(false))
```

### Fullscreen API
```typescript
// ✅ GOOD: Fullscreen toggle with browser API
const toggleFullscreen = useCallback(() => {
  const newState = !isFullscreen
  setIsFullscreen(newState)
  
  if (newState) {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    }
  } else {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}, [isFullscreen])

// ✅ GOOD: Listen for ESC key to exit fullscreen
useEffect(() => {
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement)
  }
  
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
}, [])
```

### Search and Filter
```typescript
// ✅ GOOD: Multi-criteria filtering
const filteredDevices = devices.filter(device => {
  // Search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    const matchesSearch = 
      device.name.toLowerCase().includes(query) ||
      device.ip.toLowerCase().includes(query) ||
      device.laneName.toLowerCase().includes(query)
    if (!matchesSearch) return false
  }
  
  // Status filter
  if (filterStatus !== 'all' && device.status !== filterStatus) {
    return false
  }
  
  // Type filter
  if (filterType !== 'all' && device.type !== filterType) {
    return false
  }
  
  // Lane filter
  if (filterLane !== 'all' && device.laneName !== filterLane) {
    return false
  }
  
  // Room filter
  if (filterRoom !== 'all' && device.roomId !== filterRoom) {
    return false
  }
  
  return true
})

// ✅ GOOD: Active filter indicator
const hasActiveFilters = 
  searchQuery !== '' || 
  filterStatus !== 'all' || 
  filterType !== 'all' || 
  filterLane !== 'all' ||
  filterRoom !== 'all'
```

---

## 16. MOBILE-SPECIFIC PATTERNS

### Hamburger Menu
```typescript
// ✅ GOOD: Mobile menu button positioning
<button
  onClick={() => setIsMobileOpen(!isMobileOpen)}
  className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 flex items-center justify-center bg-white rounded shadow-md hover:bg-gray-50 transition-colors"
  aria-label="Toggle menu"
  title="Toggle menu"
>
  {isMobileOpen ? (
    <X className="w-5 h-5 text-gray-700" />
  ) : (
    <Menu className="w-5 h-5 text-gray-700" />
  )}
</button>
```

### Off-Canvas Sidebar
```typescript
// ✅ GOOD: Mobile sidebar with overlay
{isMobileOpen && (
  <>
    {/* Overlay */}
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={() => setIsMobileOpen(false)}
    />
    
    {/* Sidebar */}
    <aside className={`
      fixed top-0 left-0 h-full w-64 bg-white z-40
      transform transition-transform duration-300
      ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      {/* Sidebar content */}
    </aside>
  </>
)}
```

### Touch-Friendly Targets
```typescript
// ✅ GOOD: Minimum 40x40px touch targets on mobile
<button className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center">
  <Icon className="w-5 h-5 md:w-4 md:h-4" />
</button>
```

---

## 17. PERFORMANCE PATTERNS

### SWR Configuration
```typescript
// ✅ GOOD: Optimized SWR config for real-time updates
const { data, error, mutate } = useSWR('/api/devices', fetcher, {
  refreshInterval: 5000,        // Auto-refresh every 5 seconds
  revalidateOnFocus: true,      // Refresh when window gains focus
  dedupingInterval: 2000,       // Dedupe requests within 2 seconds
  revalidateOnReconnect: true   // Refresh on network reconnect
})
```

### Debounced Search
```typescript
// ✅ GOOD: Debounce search input
const [searchQuery, setSearchQuery] = useState('')
const [debouncedQuery, setDebouncedQuery] = useState('')

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery)
  }, 300)
  
  return () => clearTimeout(timer)
}, [searchQuery])
```

### Memoized Calculations
```typescript
// ✅ GOOD: Memoize expensive calculations
const deviceStats = useMemo(() => {
  const upCount = devices.filter(d => d.status === 'up').length
  const downCount = devices.filter(d => d.status === 'down').length
  const total = devices.length
  
  return { upCount, downCount, total }
}, [devices])
```

---

## 18. COMMON PITFALLS TO AVOID

### ❌ DON'T: Forget accessibility attributes
```typescript
// ❌ BAD
<button onClick={handleClick}>
  <Icon />
</button>

// ✅ GOOD
<button 
  onClick={handleClick}
  aria-label="Close panel"
  title="Close panel"
>
  <Icon />
</button>
```

### ❌ DON'T: Use inline event handlers
```typescript
// ❌ BAD: Creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ GOOD: Use useCallback
const handleClickWithId = useCallback(() => {
  handleClick(id)
}, [id])

<button onClick={handleClickWithId}>Click</button>
```

### ❌ DON'T: Forget to clean up event listeners
```typescript
// ❌ BAD: Memory leak
useEffect(() => {
  window.addEventListener('resize', handleResize)
}, [])

// ✅ GOOD: Clean up
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

### ❌ DON'T: Use magic strings
```typescript
// ❌ BAD
if (user.role === 'ADMIN') { }

// ✅ GOOD
const ROLES = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  VIEWER: 'VIEWER'
} as const

if (user.role === ROLES.ADMIN) { }
```

### ❌ DON'T: Forget error boundaries
```typescript
// ✅ GOOD: Wrap components in error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <YourComponent />
</ErrorBoundary>
```

---

## 🎯 FINAL CHECKLIST

Before marking ANY work complete:

### Code Quality
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Proper TypeScript types (no 'any')
- [ ] Meaningful variable names
- [ ] Functions < 20 lines
- [ ] Files < 300 lines

### UI/UX
- [ ] Follows design system
- [ ] Responsive on all devices
- [ ] Accessible (WCAG AA)
- [ ] No overlapping elements
- [ ] Proper spacing
- [ ] Loading states
- [ ] Error states

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] Code split appropriately
- [ ] No memory leaks
- [ ] Fast on low-end devices

### Testing
- [ ] TypeScript compiles
- [ ] Linting passes
- [ ] Tests pass
- [ ] Diagnostics clean
- [ ] Manual testing done

### Security
- [ ] Input validated
- [ ] Auth checked
- [ ] No secrets in code
- [ ] SQL injection prevented
- [ ] XSS prevented

---

## 📚 RESOURCES

### Official Documentation
- [Next.js 14](https://nextjs.org/docs)
- [React 18](https://react.dev)
- [TypeScript 5](https://www.typescriptlang.org/docs)
- [Tailwind CSS 3](https://tailwindcss.com/docs)
- [Prisma 5](https://www.prisma.io/docs)
- [ReactFlow](https://reactflow.dev/docs)
- [SWR](https://swr.vercel.app/)
- [NextAuth.js](https://next-auth.js.org/)

### Best Practices
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Web.dev Performance](https://web.dev/performance/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Tools
- [Can I Use](https://caniuse.com/) - Browser compatibility
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - React debugging

---

## 🚀 REMEMBER

**"Quality is not an act, it is a habit."** - Aristotle

Every line of code you write is:
- ✅ A reflection of your professionalism
- ✅ An investment in maintainability
- ✅ A commitment to excellence
- ✅ A gift to future developers

**Write code you'd be proud to show.**

---

**END OF MASTER DEVELOPMENT RULES**

*These rules are living documents. Update them as the project evolves.*
