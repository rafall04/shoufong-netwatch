# Design Document

## Overview

This design document describes the architecture and implementation approach for MikroTik Dashboard Enhancements. These enhancements add three major capabilities to the existing dashboard:

1. **Connection Testing** - Real-time verification of MikroTik connectivity
2. **Device Synchronization** - Bidirectional sync between MikroTik Netwatch and dashboard
3. **Enhanced Device Management** - Optional MikroTik integration during device creation

The design follows the existing architecture patterns and integrates seamlessly with the current system.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Config Page          │  Sync Page         │  Device Form   │
│  - Test Connection    │  - Fetch Devices   │  - Sync Option │
│  - Show Results       │  - Select/Import   │  - Create+Sync │
└──────────┬────────────┴──────────┬─────────┴────────┬───────┘
           │                       │                   │
           ▼                       ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /api/config/         │  /api/mikrotik/    │  /api/devices  │
│  test-connection      │  sync-devices      │  (enhanced)    │
│  - POST: Test conn    │  - GET: Fetch      │  - POST: +sync │
│                       │  - POST: Import    │                │
└──────────┬────────────┴──────────┬─────────┴────────┬───────┘
           │                       │                   │
           ▼                       ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│              MikroTik Integration Layer                      │
├─────────────────────────────────────────────────────────────┤
│  - RouterOS API Client                                       │
│  - Connection Management                                     │
│  - Netwatch Operations (/tool/netwatch/print, add)         │
│  - Error Handling & Timeouts                                │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MikroTik RouterOS                         │
│                    Netwatch Service                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Connection Test Flow:**
1. User enters/modifies MikroTik credentials in config form
2. User clicks "Test Connection" button
3. Frontend sends POST to `/api/config/test-connection` with credentials
4. API validates input and attempts RouterOS connection
5. API returns success/failure with details
6. Frontend displays result with appropriate styling

**Device Sync Flow:**
1. User navigates to sync page
2. User clicks "Fetch Devices"
3. Frontend sends GET to `/api/mikrotik/sync-devices`
4. API connects to MikroTik and executes `/tool/netwatch/print`
5. API returns list of devices
6. User selects devices to import
7. Frontend sends POST to `/api/mikrotik/sync-devices` with selected devices
8. API creates database records for non-duplicate devices
9. API returns import summary
10. Frontend redirects to device management page

**Enhanced Device Creation Flow:**
1. User fills device form and enables "Add to MikroTik" checkbox
2. User submits form
3. Frontend sends POST to `/api/devices` with `syncToMikrotik: true`
4. API creates device in database
5. If sync enabled, API adds device to MikroTik Netwatch
6. API returns success (even if MikroTik sync fails, with warning)
7. Frontend shows result and redirects

## Components and Interfaces

### Frontend Components

#### 1. Enhanced Config Page (`app/dashboard/admin/config/page.tsx`)

**Purpose:** Add connection testing capability to existing config page

**State:**
```typescript
const [testing, setTesting] = useState(false)
const [connectionStatus, setConnectionStatus] = useState<{
  success: boolean
  message: string
  details?: any
} | null>(null)
```

**New Functions:**
```typescript
handleTestConnection(): Promise<void>
  - Validates form data
  - Calls /api/config/test-connection
  - Updates connectionStatus state
  - Displays result to user
```

**UI Changes:**
- Add "Test Connection" button next to "Save Configuration"
- Add connection status display area (success/error with details)
- Clear status when form values change

#### 2. Sync Devices Page (`app/dashboard/manage/devices/sync/page.tsx`)

**Purpose:** Server component that renders sync interface

**Responsibilities:**
- Check authentication and authorization
- Render SyncDevicesClient component
- Provide navigation back to device list

#### 3. Sync Devices Client (`components/SyncDevicesClient.tsx`)

**Purpose:** Client component for device synchronization

**State:**
```typescript
const [loading, setLoading] = useState(false)
const [importing, setImporting] = useState(false)
const [devices, setDevices] = useState<MikroTikDevice[]>([])
const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
```

**Functions:**
```typescript
handleFetchDevices(): Promise<void>
  - Calls GET /api/mikrotik/sync-devices
  - Updates devices state
  - Selects all devices by default

handleToggleDevice(ip: string): void
  - Toggles device selection

handleToggleAll(): void
  - Selects/deselects all devices

handleImport(): Promise<void>
  - Validates selection
  - Calls POST /api/mikrotik/sync-devices
  - Shows result
  - Redirects on success
```

**UI Elements:**
- Fetch button with loading state
- Device list with checkboxes
- Select all checkbox
- Selected count display
- Import button (disabled when none selected)
- Success/error messages

#### 4. Enhanced Device Form (`components/DeviceForm.tsx`)

**Purpose:** Add MikroTik sync option to device creation

**State Changes:**
```typescript
const [syncToMikrotik, setSyncToMikrotik] = useState(false)
```

**UI Changes:**
- Add checkbox "Add to MikroTik Netwatch" (only for new devices)
- Add informational text about MikroTik requirement
- Include syncToMikrotik in form submission

#### 5. Enhanced Device Management Page

**Purpose:** Add navigation to sync feature

**UI Changes:**
- Add "Sync from MikroTik" button next to "Add Device"
- Button only visible to ADMIN/OPERATOR

### Backend API Routes

#### 1. Connection Test API (`/api/config/test-connection`)

**Method:** POST

**Authentication:** Required (ADMIN only)

**Request Body:**
```typescript
{
  mikrotikIp: string
  mikrotikUser: string
  mikrotikPass: string
  mikrotikPort: number
}
```

**Response (Success):**
```typescript
{
  success: true
  message: string
  details: {
    ip: string
    port: number
    version: string
    identity: string
  }
}
```

**Response (Failure):**
```typescript
{
  success: false
  error: string
  details: string
}
```

**Implementation:**
1. Validate authentication and role
2. Validate required fields
3. Validate IP format and port range
4. Create RouterOS API connection
5. Attempt to connect with 10s timeout
6. Fetch system identity and version
7. Close connection
8. Return result

#### 2. Sync Devices API (`/api/mikrotik/sync-devices`)

**Method:** GET (fetch), POST (import)

**Authentication:** Required (ADMIN or OPERATOR)

**GET Response:**
```typescript
{
  success: true
  devices: Array<{
    name: string
    ip: string
    type: string
    status: string
  }>
  message: string
}
```

**POST Request:**
```typescript
{
  devices: Array<{
    name: string
    ip: string
    type: string
    status: string
  }>
}
```

**POST Response:**
```typescript
{
  success: true
  imported: number
  skipped: number
  devices: Device[]
  message: string
}
```

**GET Implementation:**
1. Validate authentication and role
2. Load SystemConfig
3. Connect to MikroTik
4. Execute `/tool/netwatch/print`
5. Parse and format results
6. Return device list

**POST Implementation:**
1. Validate authentication and role
2. Validate devices array
3. For each device:
   - Check if IP already exists
   - If not, create device record
   - Track imported/skipped counts
4. Return summary

#### 3. Enhanced Device Creation API (`/api/devices`)

**Changes to POST endpoint:**

**Request Body (Enhanced):**
```typescript
{
  name: string
  ip: string
  type: string
  laneName: string
  syncToMikrotik?: boolean  // NEW
}
```

**Implementation Changes:**
1. Create device in database (existing logic)
2. If syncToMikrotik is true:
   - Load SystemConfig
   - Connect to MikroTik
   - Execute `/tool/netwatch/add` with device IP and name
   - Log success/failure (don't fail request if MikroTik fails)
3. Return device with optional warning if sync failed

### MikroTik Integration Layer

**Purpose:** Centralized MikroTik operations

**Functions:**

```typescript
async function connectToMikroTik(config: SystemConfig): Promise<RouterOSAPI>
  - Creates and returns authenticated connection
  - Throws on connection failure
  - Sets 10s timeout

async function testConnection(config: SystemConfig): Promise<ConnectionResult>
  - Tests connection and fetches system info
  - Returns success/failure with details

async function fetchNetwatchDevices(config: SystemConfig): Promise<MikroTikDevice[]>
  - Connects to MikroTik
  - Executes /tool/netwatch/print
  - Parses and returns devices

async function addNetwatchDevice(config: SystemConfig, device: Device): Promise<void>
  - Connects to MikroTik
  - Executes /tool/netwatch/add
  - Configures monitoring for device
```

## Data Models

No new database models required. Uses existing:
- `SystemConfig` - MikroTik credentials
- `Device` - Device records
- `User` - Authentication

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Connection Test Validation
*For any* connection test request, if the IP address format is invalid or port is out of range (1-65535), the system should reject the request before attempting connection.

**Validates: Requirements 1.6, 1.7, 8.1, 8.2**

### Property 2: Connection Test Timeout
*For any* connection test attempt, the operation should complete within 10 seconds or return a timeout error.

**Validates: Requirements 1.8**

### Property 3: Device Sync IP Uniqueness
*For any* device import operation, if a device with the same IP already exists in the database, the system should skip that device and include it in the skipped count.

**Validates: Requirements 2.9, 8.5**

### Property 4: Device Sync Authorization
*For any* device sync request (fetch or import), if the user role is VIEWER, the system should return 403 Forbidden.

**Validates: Requirements 7.2, 7.4**

### Property 5: Sync Checkbox Visibility
*For any* device form rendering, the "Add to MikroTik Netwatch" checkbox should only be visible when creating a new device, not when editing an existing device.

**Validates: Requirements 3.7, 3.8**

### Property 6: Import Summary Accuracy
*For any* device import operation with N selected devices where M have duplicate IPs, the system should report exactly (N-M) imported and M skipped.

**Validates: Requirements 2.9, 2.10**

### Property 7: Connection Test State Clearing
*For any* configuration form, when any MikroTik credential field value changes, the previous connection test result should be cleared.

**Validates: Requirements 1.9**

### Property 8: Sync Mode Database Persistence
*For any* device created with syncToMikrotik enabled, the device should be persisted to the database even if the MikroTik sync operation fails.

**Validates: Requirements 3.6**

### Property 9: Authorization Consistency
*For any* MikroTik-related API endpoint, unauthenticated requests should return 401 and unauthorized requests should return 403.

**Validates: Requirements 7.4, 7.5**

### Property 10: Validation Error Clarity
*For any* validation failure (IP format, port range, required fields), the system should return a clear error message explaining what is invalid.

**Validates: Requirements 8.6**

## Error Handling

### Connection Errors
- **Timeout:** Return error after 10s with "Connection timeout" message
- **Authentication Failed:** Return "Invalid credentials" message
- **Network Unreachable:** Return "Cannot reach MikroTik at [IP]" message
- **Invalid Response:** Return "Unexpected response from MikroTik" message

### Validation Errors
- **Invalid IP:** "Please enter a valid IP address (e.g., 192.168.1.1)"
- **Invalid Port:** "Port must be between 1 and 65535"
- **Missing Fields:** "IP, username, and password are required"
- **Duplicate IP:** "Device with IP [X] already exists"

### Sync Errors
- **MikroTik Not Configured:** "Please configure MikroTik connection in System Settings"
- **No Devices Found:** "No devices found in MikroTik Netwatch"
- **Partial Import Failure:** "Imported X devices, skipped Y duplicates"

### User Feedback
- All errors displayed with red styling and error icon
- All successes displayed with green styling and success icon
- Loading states shown with spinners and disabled buttons
- Detailed error messages provided for troubleshooting

## Testing Strategy

### Unit Tests
- Test connection validation (IP format, port range)
- Test device sync with duplicate IPs
- Test authorization checks for each endpoint
- Test form checkbox visibility logic
- Test import summary calculations

### Property-Based Tests
- **Property 1:** Generate random invalid IPs/ports, verify rejection
- **Property 3:** Generate random device lists with duplicates, verify skip logic
- **Property 6:** Generate random import scenarios, verify summary accuracy
- **Property 9:** Test all endpoints with various auth states

### Integration Tests
- Test complete connection test flow
- Test complete device sync flow (fetch → select → import)
- Test device creation with MikroTik sync enabled
- Test error scenarios (MikroTik unreachable, invalid credentials)

### Manual Testing
- Test with real MikroTik device
- Verify UI feedback and loading states
- Test navigation flows
- Verify error messages are clear and helpful

## Security Considerations

1. **Credential Handling:** MikroTik passwords transmitted over HTTPS only
2. **Authorization:** All endpoints check user role before operations
3. **Input Validation:** All user inputs validated before processing
4. **Connection Timeouts:** Prevent hanging connections
5. **Error Messages:** Don't expose sensitive system information in errors

## Performance Considerations

1. **Connection Pooling:** Reuse connections when possible
2. **Timeout Management:** 10s timeout prevents long waits
3. **Async Operations:** All MikroTik operations are async
4. **Loading States:** UI remains responsive during operations
5. **Batch Import:** Import multiple devices in single operation

## Future Enhancements

1. **Scheduled Sync:** Automatic periodic sync from MikroTik
2. **Bidirectional Sync:** Update MikroTik when devices change in dashboard
3. **Sync History:** Track sync operations and results
4. **Advanced Filtering:** Filter devices during sync by criteria
5. **Bulk Operations:** Bulk enable/disable monitoring in MikroTik

