# Device Type Rules - Single Source of Truth

**Version:** 1.0  
**Last Updated:** January 22, 2026  
**Status:** Active - Mandatory

---

## PRINSIP UTAMA

**"Device types HARUS didefinisikan di SATU tempat saja: `lib/constants.ts`"**

---

## I. SINGLE SOURCE OF TRUTH

### File: `lib/constants.ts`

Ini adalah **SATU-SATUNYA** tempat dimana device types didefinisikan.

```typescript
export const DEVICE_TYPES = [
  'ROUTER',
  'SWITCH',
  'ACCESS_POINT',
  'PC',
  'LAPTOP',
  'TABLET',
  'PRINTER',
  'SCANNER_GTEX',
  'SMART_TV',
  'CCTV',
  'SERVER',
  'PHONE',
  'OTHER'
] as const

export type DeviceType = typeof DEVICE_TYPES[number]
```

### Exports yang Tersedia:

1. **DEVICE_TYPES** - Array of all valid device types
2. **DeviceType** - TypeScript type for device types
3. **DEVICE_TYPE_LABELS** - Human-readable labels
4. **isValidDeviceType()** - Validation function
5. **getDeviceTypeLabel()** - Get label for a type

---

## II. ATURAN WAJIB

### ❌ DILARANG KERAS

**JANGAN PERNAH** hardcode device types di file lain:

```typescript
// ❌ SALAH - Hardcoded device types
const validTypes = ['ROUTER', 'SWITCH', 'ACCESS_POINT', ...]

// ❌ SALAH - Hardcoded type union
type DeviceType = 'ROUTER' | 'SWITCH' | 'ACCESS_POINT' | ...

// ❌ SALAH - Hardcoded options
<option value="ROUTER">Router</option>
<option value="SWITCH">Switch</option>
```

### ✅ WAJIB DILAKUKAN

**SELALU** import dari `lib/constants.ts`:

```typescript
// ✅ BENAR - Import dari constants
import { DEVICE_TYPES, DeviceType, isValidDeviceType } from '@/lib/constants'

// ✅ BENAR - Use type
interface Device {
  type: DeviceType
}

// ✅ BENAR - Validate
if (!isValidDeviceType(type)) {
  throw new Error('Invalid device type')
}

// ✅ BENAR - Generate options
{DEVICE_TYPES.map(type => (
  <option key={type} value={type}>
    {DEVICE_TYPE_LABELS[type]}
  </option>
))}
```

---

## III. CARA MENAMBAH DEVICE TYPE BARU

### Langkah-Langkah (WAJIB DIIKUTI):

1. **Edit `lib/constants.ts`**
   ```typescript
   export const DEVICE_TYPES = [
     'ROUTER',
     'SWITCH',
     // ... existing types
     'NEW_TYPE'  // ← Add here
   ] as const
   ```

2. **Tambahkan Label**
   ```typescript
   export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
     ROUTER: 'Router',
     // ... existing labels
     NEW_TYPE: 'New Device Type'  // ← Add here
   }
   ```

3. **Update Prisma Schema Comment (Optional)**
   ```prisma
   // prisma/schema.prisma
   type String // ROUTER, SWITCH, ..., NEW_TYPE
   ```

4. **Run Diagnostics**
   ```bash
   # Verify no TypeScript errors
   getDiagnostics(['lib/constants.ts'])
   ```

5. **Test di UI**
   - Buka DeviceFormModal
   - Verify NEW_TYPE muncul di dropdown
   - Test create/update device dengan NEW_TYPE

6. **Commit**
   ```bash
   git add .
   git commit -m "feat: add NEW_TYPE device type"
   git push origin main
   ```

---

## IV. FILES YANG MENGGUNAKAN DEVICE TYPES

### Wajib Import dari `lib/constants.ts`:

1. **Components:**
   - `components/DeviceFormModal.tsx`
   - `components/DeviceNode.tsx`
   - `app/dashboard/map/MapContent.tsx`

2. **API Routes:**
   - `app/api/devices/route.ts`
   - `app/api/device/update/route.ts`
   - `app/api/mikrotik/sync-devices/route.ts`

3. **Types/Interfaces:**
   - Any file that defines Device interface

### Verification Checklist:

Sebelum commit, pastikan:
- [ ] Semua file import dari `lib/constants.ts`
- [ ] Tidak ada hardcoded device types
- [ ] getDiagnostics returns zero errors
- [ ] UI dropdown menampilkan semua types
- [ ] API validation menggunakan `isValidDeviceType()`

---

## V. VALIDATION PATTERN

### API Routes (Standard Pattern):

```typescript
import { DEVICE_TYPES, isValidDeviceType } from '@/lib/constants'

// Validate device type
if (!isValidDeviceType(type)) {
  return NextResponse.json(
    { 
      error: 'Invalid device type',
      details: `Type must be one of: ${DEVICE_TYPES.join(', ')}`
    },
    { status: 400 }
  )
}
```

### Components (Standard Pattern):

```typescript
import { DEVICE_TYPES, DEVICE_TYPE_LABELS, DeviceType } from '@/lib/constants'

// Generate select options
<select>
  {DEVICE_TYPES.map(type => (
    <option key={type} value={type}>
      {DEVICE_TYPE_LABELS[type]}
    </option>
  ))}
</select>
```

---

## VI. TROUBLESHOOTING

### Error: "Invalid device type"

**Penyebab:**
- Device type tidak ada di `DEVICE_TYPES` array
- Typo di device type string
- File tidak import dari `lib/constants.ts`

**Solusi:**
1. Cek `lib/constants.ts` - apakah type ada di array?
2. Cek spelling - harus EXACT match (case-sensitive)
3. Verify import statement di file yang error
4. Run `getDiagnostics` untuk cek TypeScript errors

### Error: "Type 'X' is not assignable to type 'DeviceType'"

**Penyebab:**
- Menggunakan string literal instead of DeviceType
- Type tidak ada di DEVICE_TYPES array

**Solusi:**
1. Import DeviceType: `import { DeviceType } from '@/lib/constants'`
2. Use type annotation: `const type: DeviceType = 'ROUTER'`
3. Validate before assign: `if (isValidDeviceType(str)) { type = str }`

---

## VII. BENEFITS

### Mengapa Single Source of Truth?

1. **Consistency** - Semua file menggunakan types yang sama
2. **Maintainability** - Update di 1 tempat, semua file ter-update
3. **Type Safety** - TypeScript catch errors at compile time
4. **No Duplication** - Tidak ada redundant code
5. **Easy to Extend** - Tambah type baru hanya di 1 file

### Sebelum (❌ Bad):

```
lib/constants.ts: ['ROUTER', 'SWITCH', ...]
DeviceFormModal.tsx: ['ROUTER', 'SWITCH', ...]  ← Duplicate!
API devices: ['ROUTER', 'SWITCH', ...]          ← Duplicate!
API sync: ['ROUTER', 'SWITCH', ...]             ← Duplicate!
MapContent.tsx: 'ROUTER' | 'SWITCH' | ...       ← Duplicate!
```

**Problem:** Tambah 1 type baru = update 5 files = high risk of error!

### Setelah (✅ Good):

```
lib/constants.ts: ['ROUTER', 'SWITCH', ...]     ← Single source!
DeviceFormModal.tsx: import { DEVICE_TYPES }
API devices: import { DEVICE_TYPES }
API sync: import { DEVICE_TYPES }
MapContent.tsx: import { DeviceType }
```

**Benefit:** Tambah 1 type baru = update 1 file = zero risk!

---

## VIII. ENFORCEMENT

### Pre-Commit Checklist:

Sebelum commit code yang menyentuh device types:

- [ ] Device types hanya didefinisikan di `lib/constants.ts`
- [ ] Semua file import dari `lib/constants.ts`
- [ ] Tidak ada hardcoded device type arrays
- [ ] Tidak ada hardcoded type unions
- [ ] API validation menggunakan `isValidDeviceType()`
- [ ] UI options menggunakan `DEVICE_TYPES.map()`
- [ ] getDiagnostics returns zero errors
- [ ] Manual test: create/update device works

### Code Review Checklist:

Saat review PR yang menyentuh device types:

- [ ] Verify no hardcoded device types
- [ ] Verify imports from `lib/constants.ts`
- [ ] Verify validation uses `isValidDeviceType()`
- [ ] Verify UI uses `DEVICE_TYPES.map()`
- [ ] Request changes if any violation found

---

## IX. QUICK REFERENCE

### Import Statement:

```typescript
import { 
  DEVICE_TYPES,           // Array of all types
  DeviceType,             // TypeScript type
  DEVICE_TYPE_LABELS,     // Human-readable labels
  isValidDeviceType,      // Validation function
  getDeviceTypeLabel      // Get label function
} from '@/lib/constants'
```

### Common Patterns:

```typescript
// 1. Type annotation
const type: DeviceType = 'ROUTER'

// 2. Validation
if (!isValidDeviceType(type)) {
  throw new Error('Invalid type')
}

// 3. Generate options
{DEVICE_TYPES.map(type => (
  <option key={type} value={type}>
    {DEVICE_TYPE_LABELS[type]}
  </option>
))}

// 4. Get label
const label = getDeviceTypeLabel(device.type)

// 5. Check if valid
const isValid = isValidDeviceType(userInput)
```

---

## X. REMEMBER

**"One source of truth = Zero inconsistency errors"**

Device types HARUS didefinisikan di `lib/constants.ts` dan **HANYA** di sana.

Semua file lain WAJIB import dari sana.

**NO EXCEPTIONS. NO HARDCODING.**

---

**END OF DEVICE TYPE RULES**

*Follow this rule religiously to prevent "Invalid device type" errors.*
