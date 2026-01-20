# UI Standards - MikroTik Dashboard

**Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Active - Mandatory

---

## PRINSIP UTAMA

**"Konsisten, Bersih, Responsif, Accessible"**

Setiap elemen UI harus:
1. ✅ **Konsisten** - Mengikuti pattern yang sama di seluruh aplikasi
2. ✅ **Bersih** - Tidak ada overlapping, spacing yang jelas
3. ✅ **Responsif** - Bekerja di semua ukuran layar
4. ✅ **Accessible** - Semua orang bisa menggunakan

---

## I. SPACING SYSTEM

### Base Unit: 4px

Semua spacing HARUS menggunakan kelipatan 4px:
- 4px (0.5 Tailwind unit)
- 8px (2 Tailwind unit) - **Spacing minimum antar elemen**
- 12px (3 Tailwind unit)
- 16px (4 Tailwind unit)
- 24px (6 Tailwind unit)
- 32px (8 Tailwind unit)

### Gap Standards

```typescript
// Antar panel/button yang berdekatan
gap-2  // 8px - MINIMUM

// Antar section
gap-4  // 16px

// Antar group besar
gap-6  // 24px
```

### Panel Positioning (ReactFlow Map)

**CRITICAL: Hitung dengan presisi untuk menghindari overlapping**

#### Top-Left Stack
```typescript
// Formula: Previous marginTop + Previous Height + Gap (8px minimum)

1. Controls (ReactFlow built-in)
   - Position: 0px (default)
   - Height: ~112px (3 buttons × 38px each)
   
2. Fullscreen Button
   - marginTop: 128px  // 112 + 8 + 8 (extra padding)
   - Height: ~40px (button 32px + padding)
   
3. Next Button
   - marginTop: 176px  // 128 + 40 + 8
   - Height: ~40px

// Pattern untuk menambah button baru:
marginTop = Previous marginTop + Previous height + 8px
```

#### Top-Right Stack
```typescript
1. Status Panel (Desktop)
   - marginTop: 0px
   
2. Status Panel (Mobile - below hamburger)
   - marginTop: 56px
```

#### Bottom-Left Stack
```typescript
1. Legend Button
   - marginBottom: 0px (default)
   - Height: ~40px
   
2. Legend Panel (when open)
   - marginBottom: 48px  // 40 + 8
```

#### Top-Center
```typescript
1. Layout Tools
   - marginTop: 0px (default)
```

---

## II. COLOR SYSTEM

### Primary Colors
```css
/* Blues - Primary Actions */
--blue-50: #eff6ff
--blue-500: #3b82f6
--blue-600: #2563eb   /* Primary button */
--blue-700: #1d4ed8   /* Primary hover */

/* Status Colors */
--green-500: #10b981  /* UP/Success */
--red-500: #ef4444    /* DOWN/Error */
--yellow-500: #eab308 /* Warning */
--gray-500: #6b7280   /* Unknown */

/* Neutral Colors */
--gray-50: #f9fafb    /* Background light */
--gray-100: #f3f4f6   /* Background subtle */
--gray-200: #e5e7eb   /* Border */
--gray-600: #4b5563   /* Text secondary */
--gray-700: #374151   /* Text primary */
--gray-900: #111827   /* Text emphasis */
```

### Usage Rules

```typescript
// Status indicators - STRICT
status === 'up'      → bg-green-500, text-green-600
status === 'down'    → bg-red-500, text-red-600
status === 'unknown' → bg-gray-500, text-gray-600

// Buttons
Primary   → bg-blue-600 hover:bg-blue-700
Secondary → bg-gray-200 hover:bg-gray-300
Danger    → bg-red-600 hover:bg-red-700
Success   → bg-green-600 hover:bg-green-700

// Text
Primary   → text-gray-900
Secondary → text-gray-700
Tertiary  → text-gray-600
Muted     → text-gray-500
Disabled  → text-gray-400
```

---

## III. TYPOGRAPHY

### Font Sizes (Responsive)

```typescript
// Headings
<h1 className="text-2xl md:text-3xl font-bold">
<h2 className="text-xl md:text-2xl font-semibold">
<h3 className="text-lg md:text-xl font-semibold">

// Body
<p className="text-sm md:text-base">        // 14px → 16px
<span className="text-xs md:text-sm">      // 12px → 14px
<span className="text-[10px] md:text-xs">  // 10px → 12px (timestamps)
```

### Font Weights

```typescript
font-normal    // 400 - Body text
font-medium    // 500 - Important values
font-semibold  // 600 - Section headers
font-bold      // 700 - Main headers (use sparingly)
```

---

## IV. BUTTON SYSTEM

### Icon Button (Map Controls)

```typescript
// Standard icon button
<button className="
  w-8 h-8                           // 32×32px
  flex items-center justify-center
  hover:bg-gray-100
  transition-colors
  rounded                           // Rounded corners
"
  title="Action Name"               // MANDATORY
  aria-label="Action Name"          // MANDATORY
>
  <Icon className="w-4 h-4 text-gray-700" />
</button>

// Touch-friendly (mobile)
<button className="
  w-10 h-10 md:w-8 md:h-8          // 40×40px mobile, 32×32px desktop
  flex items-center justify-center
  hover:bg-gray-100
  transition-colors
  rounded
">
  <Icon className="w-5 h-5 md:w-4 md:h-4" />
</button>
```

### Primary Button

```typescript
<button className="
  px-4 md:px-6 py-2.5
  bg-blue-600 hover:bg-blue-700
  text-white rounded-lg font-medium
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
  flex items-center gap-2
">
  <Icon className="w-4 h-4" />
  Button Text
</button>
```

### Secondary Button

```typescript
<button className="
  px-4 md:px-6 py-2.5
  bg-gray-200 hover:bg-gray-300
  text-gray-700 rounded-lg font-medium
  transition-colors duration-200
">
  Button Text
</button>
```

---

## V. PANEL SYSTEM

### Compact Panel (Single Button)

```typescript
<Panel 
  position="top-left" 
  className="bg-white rounded shadow-sm" 
  style={{ marginTop: '128px' }}  // Calculate precisely
>
  <button className="w-8 h-8 ...">
    <Icon />
  </button>
</Panel>
```

### Expanded Panel (With Content)

```typescript
<Panel 
  position="top-left" 
  className="bg-white rounded shadow-lg" 
  style={{ marginTop: '176px' }}
>
  <div className="p-2 w-56">  {/* Fixed width for consistency */}
    <div className="flex items-center justify-between pb-1 border-b mb-2">
      <span className="text-xs font-semibold text-gray-700">Panel Title</span>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        title="Close"
        aria-label="Close panel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    
    <div className="space-y-2">
      {/* Panel content */}
    </div>
  </div>
</Panel>
```

---

## VI. RESPONSIVE DESIGN

### Breakpoints (Tailwind)

```
Mobile:  < 640px   (sm)
Tablet:  640-767px (sm-md)
Desktop: ≥ 768px   (md+)
Large:   ≥ 1024px  (lg+)
```

### Mobile-First Patterns

```typescript
// Hide on mobile, show on desktop
className="hidden md:block"

// Show on mobile, hide on desktop
className="block md:hidden"

// Responsive sizing
className="w-full md:w-64"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Responsive flex direction
className="flex-col md:flex-row"
```

### Touch Targets (Mobile)

```typescript
// MINIMUM touch target: 40×40px
<button className="w-10 h-10 md:w-8 md:h-8">
  <Icon className="w-5 h-5 md:w-4 md:h-4" />
</button>

// Spacing between touch targets: 8px minimum
<div className="flex gap-2">
  <button className="w-10 h-10">...</button>
  <button className="w-10 h-10">...</button>
</div>
```

---

## VII. ACCESSIBILITY (a11y)

### Mandatory Attributes

```typescript
// All buttons MUST have
<button
  title="Action description"        // Tooltip
  aria-label="Action description"   // Screen reader
>

// All inputs MUST have
<input
  id="field-id"
  aria-describedby="helper-id"
/>
<label htmlFor="field-id">Label</label>

// All images MUST have
<img alt="Description" />

// Standalone icons
<Icon aria-hidden="true" />
```

### Keyboard Navigation

- Tab order must be logical
- Focus visible on all interactive elements
- Escape closes modals/dropdowns
- Enter submits forms
- Delete key for deletable items (if permitted)

### Color Contrast

- Text: Minimum 4.5:1 ratio
- UI Components: Minimum 3:1 ratio
- Never rely on color alone to convey information

---

## VIII. ANIMATION & TRANSITIONS

### Allowed Animations (Lightweight Only)

```typescript
// Color transitions (buttons, links)
transition-colors duration-200

// Opacity (fade in/out)
transition-opacity duration-200

// Transform (hover scale - buttons only)
transform hover:scale-105 transition-transform duration-200

// Spin (loading only)
animate-spin
```

### FORBIDDEN Animations

❌ backdrop-blur (heavy on performance)
❌ Complex keyframe animations
❌ Multiple simultaneous animations
❌ Continuous animations (except loading)
❌ 3D transforms

---

## IX. FORM SYSTEM

### Input Field

```typescript
<div className="space-y-1">
  <label className="block text-sm font-medium text-gray-700">
    Field Label {required && <span className="text-red-500">*</span>}
  </label>
  <input
    type="text"
    className="
      w-full px-3 py-2
      border border-gray-300 rounded-lg
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:bg-gray-100 disabled:cursor-not-allowed
      transition-colors
    "
    placeholder="Placeholder"
    autoComplete="off"  // or appropriate value
  />
  {error && (
    <p className="text-sm text-red-600 flex items-center gap-1">
      <span>⚠</span> {error}
    </p>
  )}
</div>
```

### Select Field

```typescript
<select className="
  w-full px-3 py-2
  border border-gray-300 rounded-lg
  focus:outline-none focus:ring-2 focus:ring-blue-500
  transition-colors
">
  <option value="">Select option</option>
  <option value="1">Option 1</option>
</select>
```

---

## X. MODAL/DIALOG SYSTEM

### Overlay Modal

```typescript
{showModal && (
  <>
    {/* Overlay */}
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40"
      onClick={handleClose}
    />
    
    {/* Modal */}
    <div className="
      fixed inset-0 md:inset-auto
      md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
      w-full md:w-auto md:max-w-2xl
      bg-white rounded-none md:rounded-lg
      z-50 overflow-y-auto
      p-6
    ">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Modal Title</h2>
        <button onClick={handleClose}>
          <X className="w-5 h-5" />
        </button>
      </div>
      {/* Modal content */}
    </div>
  </>
)}
```

---

## XI. NOTIFICATION SYSTEM

### Success Message

```typescript
<div className="p-4 rounded-lg bg-green-50 text-green-800 border border-green-200 flex items-start gap-3">
  <span className="text-green-600">✓</span>
  <div className="flex-1">
    <p className="font-semibold">Success!</p>
    <p className="text-sm">Operation completed</p>
  </div>
</div>
```

### Error Message

```typescript
<div className="p-4 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-start gap-3">
  <span className="text-red-600">✗</span>
  <div className="flex-1">
    <p className="font-semibold">Error</p>
    <p className="text-sm">{errorMessage}</p>
  </div>
</div>
```

---

## XII. LOADING STATES

### Page Loading

```typescript
<div className="flex items-center justify-center h-screen">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Loading...</p>
  </div>
</div>
```

### Button Loading

```typescript
<button disabled={loading}>
  {loading ? (
    <>
      <span className="animate-spin inline-block">⟳</span>
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

---

## XIII. PROJECT-SPECIFIC PATTERNS

### Device Status Badge

```typescript
<div className="flex items-center gap-2">
  <div className={`w-2 h-2 rounded-full ${
    status === 'up' ? 'bg-green-500' :
    status === 'down' ? 'bg-red-500' :
    'bg-gray-500'
  }`} />
  <span className="text-sm font-medium">
    {status.toUpperCase()}
  </span>
</div>
```

### Role Badge

```typescript
<span className={`
  px-2 py-1 rounded text-xs font-medium
  ${role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
    role === 'OPERATOR' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-700'}
`}>
  {role}
</span>
```

### Indonesian Date Format

```typescript
// Format: "19 Jan, 11:34"
function formatIndonesianDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  
  const day = date.getDate()
  const month = months[date.getMonth()]
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  
  return `${day} ${month}, ${hours}:${minutes}`
}
```

---

## XIV. CHECKLIST SEBELUM COMMIT

### Code Quality
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Proper TypeScript types (no 'any')
- [ ] Meaningful variable names

### UI/UX
- [ ] Follows spacing system (8px minimum gap)
- [ ] Responsive on all devices
- [ ] All buttons have title and aria-label
- [ ] No overlapping elements
- [ ] Proper color usage
- [ ] Loading states implemented
- [ ] Error states implemented

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient (4.5:1)
- [ ] Focus indicators visible

### Performance
- [ ] No unnecessary re-renders
- [ ] Images optimized
- [ ] No heavy animations
- [ ] Works on low-end devices

---

## XV. COMMON MISTAKES TO AVOID

### ❌ DON'T

```typescript
// Hardcode positions without calculating
style={{ marginTop: '120px' }}  // Too close!

// Use arbitrary spacing
className="mt-3"  // Not in 4px system

// Forget accessibility
<button onClick={handleClick}>  // Missing title/aria-label
  <Icon />
</button>

// Mix button styles
<button className="px-3 py-2">  // Inconsistent with standard
```

### ✅ DO

```typescript
// Calculate positions precisely
style={{ marginTop: '128px' }}  // 112 + 8 + 8

// Use spacing system
className="mt-2"  // 8px, follows system

// Add accessibility
<button 
  onClick={handleClick}
  title="Action Name"
  aria-label="Action Name"
>
  <Icon />
</button>

// Use standard button styles
<button className="px-4 md:px-6 py-2.5">  // Standard
```

---

## XVI. QUICK REFERENCE

### Most Common Classes

```typescript
// Containers
"container mx-auto px-4 md:px-6 py-6 md:py-8"

// Cards
"bg-white border rounded-lg p-4 md:p-6"

// Buttons
"px-4 md:px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"

// Inputs
"w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"

// Text
"text-sm md:text-base text-gray-900"

// Spacing
"space-y-2" "gap-2" "mb-4"

// Grid
"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Flex
"flex items-center justify-between gap-2"
```

---

## REMEMBER

**"Consistency is key. Quality over speed."**

Setiap elemen UI harus:
- ✅ Mengikuti spacing system (8px minimum)
- ✅ Menggunakan color system yang konsisten
- ✅ Responsive di semua device
- ✅ Accessible untuk semua user
- ✅ Performant di low-end devices

**NO EXCEPTIONS. NO COMPROMISES.**

---

**END OF UI STANDARDS**

*Follow these rules religiously for consistent, professional UI.*
