# Implementation Plan: MikroTik Dashboard Enhancements

## Overview

This implementation plan adds MikroTik integration enhancements to the existing dashboard. The plan builds incrementally: API endpoints → frontend components → integration testing. Most backend code already exists and needs completion/refinement.

## Tasks

- [-] 1. Complete MikroTik connection test API
  - [x] 1.1 Implement RouterOS API connection in test-connection route
    - Replace simulated connection with actual RouterOS API client
    - Add proper error handling for connection failures
    - Implement 10-second timeout
    - Fetch real system identity and version from MikroTik
    - Return actual connection details or specific error messages
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.8, 6.1, 6.2, 6.5, 6.6, 6.7_



- [ ] 2. Complete device synchronization API
  - [x] 2.1 Implement MikroTik device fetch in sync-devices GET
    - Replace simulated data with actual `/tool/netwatch/print` query
    - Parse MikroTik response to extract device information
    - Map MikroTik device types to dashboard types
    - Handle connection errors gracefully
    - Return formatted device list
    - _Requirements: 2.3, 2.4, 6.3, 6.5, 6.7, 6.8_

  - [x] 2.2 Enhance device import in sync-devices POST
    - Validate devices array structure
    - Check for duplicate IPs before creating each device
    - Create device records with proper defaults (laneName: "Imported", position: 0,0)
    - Track imported and skipped counts accurately
    - Return detailed import summary
    - _Requirements: 2.8, 2.9, 2.10, 2.12, 2.13, 8.4, 8.5_



- [x] 3. Enhance device creation API with MikroTik sync
  - [x] 3.1 Add MikroTik sync logic to POST /api/devices
    - Accept optional `syncToMikrotik` boolean in request body
    - Create device in database (existing logic)
    - If syncToMikrotik is true:
      - Load SystemConfig
      - Connect to MikroTik
      - Execute `/tool/netwatch/add` with device IP and name
      - Log result but don't fail request if MikroTik operation fails
    - Return device with optional warning if sync failed
    - _Requirements: 3.4, 3.5, 3.6, 6.4, 6.7_



- [x] 4. Checkpoint - Backend APIs complete
  - Verify connection test works with real MikroTik
  - Verify device sync fetches real Netwatch data
  - Verify device import handles duplicates correctly
  - Verify device creation with sync adds to MikroTik
  - Ask user if questions arise

- [ ] 4. Checkpoint - Backend APIs complete
  - Verify connection test works with real MikroTik
  - Verify device sync fetches real Netwatch data
  - Verify device import handles duplicates correctly
  - Verify device creation with sync adds to MikroTik
  - Ask user if questions arise

- [x] 5. Enhance system configuration page
  - [x] 5.1 Add connection test UI to config page
    - Add "Test Connection" button next to "Save Configuration"
    - Add loading state during test (spinner, disabled button)
    - Add connection status display area (success/error)
    - Display MikroTik details on success (IP, port, version, identity)
    - Display error message and details on failure
    - Clear status when form values change
    - Style success messages with green, errors with red
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.9, 5.1, 5.2_



- [x] 6. Create device synchronization UI
  - [x] 6.1 Verify sync page and client component
    - Ensure SyncDevicesClient component is properly integrated
    - Verify "Fetch Devices" button functionality
    - Verify device list rendering with checkboxes
    - Verify "Select All" checkbox functionality
    - Verify selected count display
    - Verify "Import" button state (disabled when none selected)
    - Verify loading states (spinners, disabled buttons)
    - Verify success/error message display
    - Verify redirect after successful import
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.11, 5.3, 5.4, 5.5, 5.7_



- [x] 7. Enhance device form with MikroTik sync option
  - [x] 7.1 Add sync checkbox to DeviceForm component
    - Add "Add to MikroTik Netwatch" checkbox (only for new devices)
    - Add informational text about MikroTik configuration requirement
    - Set checkbox unchecked by default
    - Include syncToMikrotik in form submission data
    - Hide checkbox when editing existing device
    - Style checkbox section with blue background for visibility
    - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8_



- [x] 8. Add navigation to sync feature
  - [x] 8.1 Add "Sync from MikroTik" button to device management page
    - Add button next to "Add Device" button
    - Style consistently with existing buttons
    - Only show to ADMIN and OPERATOR roles
    - Navigate to /dashboard/manage/devices/sync on click
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 8.2 Verify sync page navigation
    - Ensure "Back to Devices" link works correctly
    - Verify breadcrumb/navigation consistency
    - _Requirements: 4.4_



- [x] 9. Implement comprehensive error handling
  - [x] 9.1 Standardize error messages across all components
    - Connection test errors (timeout, auth failed, unreachable)
    - Device sync errors (not configured, no devices, fetch failed)
    - Import errors (validation, partial failure)
    - Display all errors with consistent red styling
    - Display all successes with consistent green styling
    - Include error details for troubleshooting
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.6_





- [x] 11. Final checkpoint - Enhancements complete
  - Verify all code compiles without errors using getDiagnostics
  - Test with real MikroTik device (manual testing by user)
  - Verify all UI feedback is clear and helpful
  - Verify error handling works correctly
  - Verify navigation flows are intuitive
  - Ask user if questions arise

## Notes

- Most backend code already exists and needs completion (remove simulated data, add real MikroTik API calls)
- Frontend components already exist and need minor enhancements
- Focus on replacing TODO comments with actual implementations
- Each task references specific requirements for traceability
- Use existing MikroTik configuration from SystemConfig table
- Handle MikroTik connection errors gracefully (don't crash the app)
- Provide clear user feedback for all operations
- Verify all code compiles without errors using getDiagnostics after each implementation

