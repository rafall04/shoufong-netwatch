# Implementation Plan: MikroTik Netwatch Visual Dashboard

## Overview

This implementation plan breaks down the MikroTik Netwatch Visual Dashboard into discrete, incremental tasks. Each task builds on previous work, ensuring the system is functional at each checkpoint. The plan follows a bottom-up approach: database → authentication → backend APIs → frontend components → integration.

## Tasks

- [x] 1. Project initialization and database setup
  - Initialize Next.js 14+ project with TypeScript and App Router
  - Install dependencies: Prisma, NextAuth.js, Tailwind CSS, React Flow, Lucide React, bcryptjs, node-routeros
  - Configure Prisma with SQLite datasource (`file:./devicemap.db`)
  - Create complete Prisma schema with User, SystemConfig, and Device models
  - Generate Prisma client
  - Create seed script (`prisma/seed.ts`) to generate default ADMIN user (username: admin, password: admin123)
  - Run migrations and seed database
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 1.1 Write property test for database schema
  - **Property 12: Configuration singleton**
  - **Validates: Requirements 4.1**

- [x] 2. Authentication implementation
  - [x] 2.1 Configure NextAuth.js v5 with Credentials provider
    - Create `auth.ts` with NextAuth configuration
    - Implement Credentials provider with Prisma user lookup
    - Add bcrypt password verification
    - Extend JWT and session callbacks to include user role and ID
    - Configure sign-in page route
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test for password hashing
    - **Property 7: Password hashing**
    - **Validates: Requirements 1.2, 7.3**

  - [x] 2.3 Write property test for session role inclusion
    - **Property 8: Session role inclusion**
    - **Validates: Requirements 1.3**

  - [x] 2.4 Create authentication middleware
    - Create `middleware.ts` for route protection
    - Implement role-based access control for `/dashboard/admin/*` (ADMIN only)
    - Implement role-based access control for `/dashboard/manage/*` (ADMIN and OPERATOR)
    - Allow all authenticated users to access `/dashboard/map`
    - Redirect unauthenticated users to login page
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 2.5 Write property test for role-based route access
    - **Property 1: Role-based route access enforcement**
    - **Validates: Requirements 1.5, 1.6**

  - [x] 2.6 Create login page
    - Create `app/login/page.tsx` with login form
    - Implement form validation
    - Call NextAuth signIn on form submission
    - Handle authentication errors
    - Redirect to dashboard on success
    - _Requirements: 1.2_

- [x] 3. Checkpoint - Authentication working
  - Verify user can log in with default admin credentials
  - Verify session contains user role
  - Verify middleware redirects work correctly
  - Ask user if questions arise

- [-] 4. Backend API routes for device management
  - [x] 4.1 Create GET /api/devices endpoint
    - Implement route handler to fetch all devices from database
    - Add authentication check
    - Return devices array as JSON
    - _Requirements: 10.1_

  - [x] 4.2 Create POST /api/devices endpoint
    - Implement route handler for device creation
    - Add role check (ADMIN or OPERATOR only)
    - Validate required fields (name, ip, type, laneName)
    - Check IP uniqueness constraint
    - Create device with default status "unknown" and position (0, 0)
    - Return created device or error
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.2, 10.8, 10.9_

  - [x] 4.3 Write property test for IP uniqueness
    - **Property 2: IP address uniqueness**
    - **Validates: Requirements 2.1**

  - [x] 4.4 Write property test for device creation defaults
    - **Property 14: Device creation with defaults**
    - **Validates: Requirements 2.4**

  - [x] 4.5 Create PUT /api/devices/[id] endpoint
    - Implement route handler for device updates
    - Add role check (ADMIN or OPERATOR only)
    - Validate device exists
    - Update device fields
    - Return updated device or error
    - _Requirements: 2.5, 10.3, 10.8, 10.9_

  - [x] 4.6 Create DELETE /api/devices/[id] endpoint
    - Implement route handler for device deletion
    - Add role check (ADMIN or OPERATOR only)
    - Validate device exists
    - Delete device from database
    - Return success response
    - _Requirements: 2.6, 10.4, 10.8, 10.9_

  - [x] 4.7 Create POST /api/device/move endpoint
    - Implement route handler for position updates
    - Add role check (ADMIN or OPERATOR only)
    - Validate deviceId, positionX, positionY
    - Update device coordinates in database
    - Return success response
    - _Requirements: 5.6, 10.5, 10.8, 10.9_

  - [x] 4.8 Write property test for position persistence
    - **Property 5: Position persistence**
    - **Validates: Requirements 5.5, 5.6**

  - [x] 4.9 Write property test for API authorization
    - **Property 11: API authorization**
    - **Validates: Requirements 2.7, 10.8**

  - [x] 4.10 Write unit tests for device API endpoints
    - Test successful device creation
    - Test IP uniqueness validation error
    - Test unauthorized access (403)
    - Test device update and deletion
    - _Requirements: 2.1, 2.5, 2.6, 2.7_

- [x] 5. Backend API routes for configuration and profile
  - [x] 5.1 Create GET /api/config endpoint
    - Implement route handler to fetch system configuration
    - Add role check (ADMIN only)
    - Return SystemConfig record
    - _Requirements: 10.6, 10.8_

  - [x] 5.2 Create PUT /api/config endpoint
    - Implement route handler for configuration updates
    - Add role check (ADMIN only)
    - Validate polling interval is positive integer
    - Update SystemConfig in database
    - Return updated config
    - _Requirements: 4.2, 4.3, 4.5, 10.7, 10.8_

  - [x] 5.3 Write property test for polling interval configuration
    - **Property 15: Polling interval configuration**
    - **Validates: Requirements 4.2, 4.5**

  - [x] 5.4 Create POST /api/profile/password endpoint
    - Implement route handler for password changes
    - Verify current password with bcrypt
    - Hash new password with bcrypt
    - Update user password in database
    - Return success or error response
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 10.8, 10.9_

  - [x] 5.5 Write unit tests for config and profile endpoints
    - Test config update by ADMIN
    - Test config access denied for non-ADMIN
    - Test password change with valid current password
    - Test password change with invalid current password
    - _Requirements: 4.2, 4.6, 7.2, 7.3_

- [x] 6. Checkpoint - Backend APIs complete
  - Verify all API endpoints respond correctly
  - Verify role-based authorization works
  - Verify device CRUD operations persist to database
  - Ask user if questions arise

- [-] 7. Device management frontend
  - [x] 7.1 Create device list page
    - Create `app/dashboard/manage/devices/page.tsx`
    - Fetch devices using Prisma (Server Component)
    - Render responsive table with device information
    - Display device type icons using Lucide React
    - Show status badges with color coding
    - Add "Add Device" button (role-gated)
    - _Requirements: 2.1, 2.2, 9.2, 9.3_

  - [x] 7.2 Create device form component
    - Create `components/DeviceForm.tsx` as Client Component
    - Add form fields: name, IP, type (select), laneName
    - Implement form validation
    - Call API endpoint for create/update
    - Handle success and error responses
    - Display validation errors
    - _Requirements: 2.2, 2.3_

  - [x] 7.3 Add edit and delete functionality
    - Add edit button to each table row
    - Open DeviceForm in modal for editing
    - Add delete button with confirmation
    - Call appropriate API endpoints
    - Refresh table after operations
    - _Requirements: 2.5, 2.6_

  - [x] 7.4 Write unit tests for device management components
    - Test DeviceForm validation
    - Test device table rendering
    - Test edit and delete button visibility based on role
    - _Requirements: 2.2, 2.3, 2.7_

- [-] 8. Interactive map frontend
  - [x] 8.1 Create custom device node component
    - Create `components/DeviceNode.tsx`
    - Implement icon mapping: ROUTER → Router, TABLET → Tablet, SCANNER_GTEX → ScanBarcode, SMART_TV → Tv
    - Apply status styling: UP → green, DOWN → red + animate-pulse
    - Display device name and lane name as labels
    - _Requirements: 5.2, 5.3, 5.4, 5.9_

  - [x] 8.2 Write property test for icon mapping consistency
    - **Property 3: Device type icon mapping consistency**
    - **Validates: Requirements 5.2**

  - [x] 8.3 Write property test for status visual indication
    - **Property 4: Status visual indication**
    - **Validates: Requirements 5.3, 5.4**

  - [x] 8.4 Create device map page
    - Create `app/dashboard/map/page.tsx` as Client Component
    - Set up React Flow with custom node types
    - Fetch device data using SWR with 5-second revalidation interval
    - Transform devices to React Flow nodes with stored positions
    - Implement onNodeDragStop handler to call /api/device/move
    - Set draggable based on user role (disable for VIEWER)
    - Configure React Flow controls and styling
    - _Requirements: 5.1, 5.5, 5.6, 5.7, 5.8, 6.1, 6.2_

  - [x] 8.5 Write property test for drag permission enforcement
    - **Property 6: Drag permission enforcement**
    - **Validates: Requirements 5.7**

  - [x] 8.6 Write property test for client-side status refresh
    - **Property 13: Client-side status refresh**
    - **Validates: Requirements 6.1, 5.8**

  - [x] 8.7 Write unit tests for map components
    - Test DeviceNode renders correct icon for each type
    - Test DeviceNode applies correct styling for each status
    - Test map disables dragging for VIEWER role
    - Test map enables dragging for ADMIN/OPERATOR roles
    - _Requirements: 5.2, 5.3, 5.4, 5.7_

- [-] 9. System configuration frontend
  - [x] 9.1 Create system config page
    - Create `app/dashboard/admin/config/page.tsx` (ADMIN only)
    - Fetch current SystemConfig
    - Create form with fields: mikrotikIp, mikrotikUser, mikrotikPass, mikrotikPort, pollingInterval
    - Implement form validation
    - Call PUT /api/config on submit
    - Display success/error messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 9.2 Write unit tests for config form
    - Test form validation
    - Test ADMIN-only access
    - Test successful config update
    - _Requirements: 4.2, 4.6_

- [-] 10. User profile frontend
  - [x] 10.1 Create profile page
    - Create `app/dashboard/profile/page.tsx`
    - Create password change form
    - Add fields: current password, new password, confirm password
    - Implement client-side validation
    - Call POST /api/profile/password
    - Display success/error messages
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.2 Write unit tests for profile form
    - Test password validation
    - Test form submission
    - Test error handling
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

- [-] 11. Dashboard layout and navigation
  - [x] 11.1 Create dashboard layout
    - Create `app/dashboard/layout.tsx`
    - Add authentication check (redirect if not logged in)
    - Create sidebar navigation component
    - Display user info and logout button
    - _Requirements: 1.4, 9.1_

  - [x] 11.2 Create role-based sidebar
    - Create `components/Sidebar.tsx`
    - Show navigation links based on user role:
      - ADMIN: Map, Devices, Config, Profile
      - OPERATOR: Map, Devices, Profile
      - VIEWER: Map, Profile
    - Highlight active route
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [x] 11.3 Write unit tests for layout components
    - Test sidebar shows correct links for each role
    - Test active route highlighting
    - Test logout functionality
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

- [x] 12. Checkpoint - Frontend complete
  - Verify all pages render correctly
  - Verify role-based UI elements work
  - Verify map displays devices with correct icons and colors
  - Verify drag-and-drop updates positions
  - Ask user if questions arise

- [-] 13. Background worker implementation
  - [x] 13.1 Create MikroTik poller worker
    - Create `worker.ts` in project root
    - Import Prisma client and node-routeros library
    - Implement pollMikroTik function:
      - Load SystemConfig from database
      - Connect to MikroTik using configured credentials
      - Execute `/tool/netwatch/print` command
      - Compare netwatch results with database devices
      - Update device status and lastSeen when changed
      - Handle connection errors gracefully (log and continue)
    - Implement startPoller function with setInterval
    - Use polling interval from SystemConfig
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 13.2 Write property test for device status update
    - **Property 9: Device status update on change**
    - **Validates: Requirements 3.6**

  - [x] 13.3 Write property test for poller resilience
    - **Property 10: Poller resilience**
    - **Validates: Requirements 3.7**

  - [x] 13.4 Write unit tests for poller
    - Test successful MikroTik connection
    - Test status update logic
    - Test error handling (connection failure)
    - Test polling interval configuration
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 13.5 Add worker startup script
    - Add npm script to run worker: `"worker": "tsx worker.ts"`
    - Document worker startup in README
    - _Requirements: 3.1_

- [-] 14. Styling and responsive design
  - [x] 14.1 Apply Tailwind CSS styling
    - Style all components with Tailwind classes
    - Implement consistent color scheme (green for UP, red for DOWN)
    - Add responsive breakpoints for mobile/tablet/desktop
    - Style forms with proper spacing and validation states
    - Style tables with scrolling on small screens
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6_

  - [x] 14.2 Optimize map viewport
    - Configure React Flow to scale to viewport
    - Add zoom and pan controls
    - Set appropriate default zoom level
    - _Requirements: 9.4_

  - [x] 14.3 Write visual regression tests
    - Test responsive layouts on different screen sizes
    - Test color scheme consistency
    - _Requirements: 9.2, 9.3, 9.4_

- [-] 15. Final integration and testing
  - [x] 15.1 Integration testing
    - Test complete authentication flow
    - Test device CRUD through UI
    - Test map interaction with database persistence
    - Test worker polling and status updates
    - _Requirements: All_

  - [x] 15.2 End-to-end testing
    - Test user login and navigation for each role
    - Test device creation and map visualization
    - Test drag-and-drop position updates
    - Test real-time status updates on map
    - _Requirements: All_

  - [x] 15.3 Error handling verification
    - Test all error scenarios
    - Verify appropriate error messages display
    - Verify system remains stable after errors
    - _Requirements: All_

- [x] 16. Final checkpoint - System complete
  - Run all tests and verify they pass
  - Verify worker runs without crashing
  - Verify all features work end-to-end
  - Ask user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The worker process must run separately from the Next.js application
- Use TypeScript strict mode throughout
- Follow Next.js App Router conventions (Server Components by default, 'use client' only when needed)
