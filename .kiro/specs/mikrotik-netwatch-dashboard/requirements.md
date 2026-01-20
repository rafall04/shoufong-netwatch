# Requirements Document

## Introduction

This document specifies the requirements for a MikroTik Netwatch Visual Dashboard - a real-time monitoring system for network devices (Routers, QC Tablets, Scanners, Smart TVs) with visual lane-based mapping, integrated with MikroTik Netwatch for status polling.

## Glossary

- **System**: The MikroTik Netwatch Visual Dashboard application
- **Device**: A network device being monitored (Router, Tablet, Scanner, or Smart TV)
- **Netwatch**: MikroTik's network monitoring tool that tracks device availability
- **Lane**: A logical grouping identifier for devices (e.g., "Lane A", "Production Line 1")
- **Node**: A visual representation of a Device on the interactive map
- **Poller**: A background worker process that queries MikroTik Netwatch for device status
- **Map**: The interactive visual dashboard displaying device nodes and their status
- **Role**: User permission level (ADMIN, OPERATOR, or VIEWER)

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a system administrator, I want role-based access control, so that different users have appropriate permissions based on their responsibilities.

#### Acceptance Criteria

1. THE System SHALL support three distinct roles: ADMIN, OPERATOR, and VIEWER
2. WHEN a user attempts to log in, THE System SHALL verify credentials against the database using password hashing
3. WHEN authentication succeeds, THE System SHALL create a session containing user ID, username, name, and role
4. THE System SHALL persist user sessions across page navigations
5. WHEN a VIEWER attempts to access administrative or management routes, THE System SHALL redirect them to the map view
6. WHEN an OPERATOR attempts to access administrative routes, THE System SHALL redirect them to an authorized page
7. WHEN an ADMIN accesses any route, THE System SHALL grant full access

### Requirement 2: Device Management

**User Story:** As an operator, I want to manage network devices in the system, so that I can add, update, and remove devices being monitored.

#### Acceptance Criteria

1. WHEN an ADMIN or OPERATOR creates a new device, THE System SHALL validate that the IP address is unique
2. WHEN creating a device, THE System SHALL require name, IP address, device type, and lane name
3. THE System SHALL support four device types: ROUTER, TABLET, SCANNER_GTEX, and SMART_TV
4. WHEN a device is created, THE System SHALL initialize its status as "unknown" and position coordinates as (0, 0)
5. WHEN an ADMIN or OPERATOR updates a device, THE System SHALL persist the changes to the database
6. WHEN an ADMIN or OPERATOR deletes a device, THE System SHALL remove it from the database and map
7. WHEN a VIEWER attempts device management operations, THE System SHALL deny the request

### Requirement 3: MikroTik Integration and Status Polling

**User Story:** As a system administrator, I want the system to automatically poll MikroTik Netwatch, so that device status is updated in real-time without manual intervention.

#### Acceptance Criteria

1. THE System SHALL run a background worker process separate from the web application
2. WHEN the Poller starts, THE System SHALL load MikroTik connection credentials and polling interval from the SystemConfig table
3. THE Poller SHALL connect to the MikroTik device using the configured IP, username, password, and port
4. THE Poller SHALL execute the `/tool/netwatch/print` command at the configured interval
5. WHEN the Poller receives Netwatch data, THE System SHALL compare device status with the database
6. WHEN a device status changes from UP to DOWN or vice versa, THE System SHALL update the Device status and lastSeen timestamp in the database
7. IF the MikroTik connection fails, THE Poller SHALL log the error and continue attempting to reconnect without crashing
8. THE System SHALL NOT perform status polling from the browser client

### Requirement 4: System Configuration Management

**User Story:** As an administrator, I want to configure MikroTik connection settings and polling intervals, so that the system can adapt to different network environments.

#### Acceptance Criteria

1. THE System SHALL store a single SystemConfig record containing MikroTik connection parameters
2. WHEN an ADMIN updates the polling interval, THE System SHALL validate it is a positive integer
3. WHEN an ADMIN updates MikroTik credentials, THE System SHALL encrypt the password before storage
4. THE System SHALL provide default values: polling interval of 30 seconds
5. WHEN configuration changes are saved, THE Poller SHALL reload the new settings on its next cycle
6. WHEN a non-ADMIN user attempts to access system configuration, THE System SHALL deny access

### Requirement 5: Interactive Visual Map

**User Story:** As a user, I want to view an interactive map of all network devices, so that I can quickly identify device status and locations.

#### Acceptance Criteria

1. THE System SHALL display all devices as nodes on an interactive map using React Flow
2. WHEN rendering a device node, THE System SHALL display an icon based on device type: Router icon for ROUTER, Tablet icon for TABLET, Scan/Barcode icon for SCANNER_GTEX, TV/Monitor icon for SMART_TV
3. WHEN a device status is "down", THE System SHALL render the node with red color and pulsing animation
4. WHEN a device status is "up", THE System SHALL render the node with green color
5. THE System SHALL position each node at coordinates stored in the database (positionX, positionY)
6. WHEN an ADMIN or OPERATOR drags a node to a new position, THE System SHALL update the device coordinates in the database
7. WHEN a VIEWER views the map, THE System SHALL disable node dragging
8. THE System SHALL refresh device status from the server every 5 seconds without full page reload
9. WHEN displaying a node, THE System SHALL show device name and lane name as labels

### Requirement 6: Real-Time Status Updates

**User Story:** As a user, I want the map to automatically reflect current device status, so that I can monitor the network without manual refreshing.

#### Acceptance Criteria

1. THE System SHALL poll the device status API endpoint every 5 seconds from the client
2. WHEN device status data is received, THE System SHALL update node colors and animations without page reload
3. WHEN the API request fails, THE System SHALL retry on the next polling cycle
4. THE System SHALL display the last seen timestamp for each device
5. WHEN a device has not been seen for more than the polling interval, THE System SHALL indicate a stale status

### Requirement 7: User Profile Management

**User Story:** As a user, I want to change my own password, so that I can maintain account security.

#### Acceptance Criteria

1. THE System SHALL provide a profile page accessible to all authenticated users
2. WHEN a user changes their password, THE System SHALL require the current password for verification
3. WHEN a user submits a new password, THE System SHALL hash it before storing in the database
4. WHEN password change succeeds, THE System SHALL display a success message
5. WHEN password change fails, THE System SHALL display an appropriate error message

### Requirement 8: Database Schema and Data Persistence

**User Story:** As a system architect, I want a well-defined database schema using SQLite, so that data is stored reliably and efficiently.

#### Acceptance Criteria

1. THE System SHALL use SQLite as the database engine with file path `./devicemap.db`
2. THE System SHALL define a User model with fields: id, username, password (hashed), name, and role
3. THE System SHALL define a SystemConfig model with fields: id, pollingInterval, mikrotikIp, mikrotikUser, mikrotikPass, and mikrotikPort
4. THE System SHALL define a Device model with fields: id, ip (unique), name, type, laneName, status, positionX, positionY, and lastSeen
5. WHEN the database is initialized, THE System SHALL create a default ADMIN user with username "admin" and password "admin123"
6. THE System SHALL enforce unique constraints on User.username and Device.ip
7. THE System SHALL use Prisma ORM for all database operations

### Requirement 9: Responsive UI and Styling

**User Story:** As a user, I want a responsive and visually appealing interface, so that I can use the system on different devices and screen sizes.

#### Acceptance Criteria

1. THE System SHALL use Tailwind CSS for all styling
2. THE System SHALL implement responsive layouts that work on desktop, tablet, and mobile screens
3. WHEN displaying the device management table, THE System SHALL make it scrollable on smaller screens
4. WHEN displaying the interactive map, THE System SHALL scale appropriately to the viewport size
5. THE System SHALL use Lucide React icons consistently throughout the interface
6. THE System SHALL follow a consistent color scheme: green for UP status, red for DOWN status

### Requirement 10: API Endpoints

**User Story:** As a frontend developer, I want well-defined API endpoints, so that the client can interact with the backend efficiently.

#### Acceptance Criteria

1. THE System SHALL provide a `/api/devices` endpoint for listing all devices
2. THE System SHALL provide a `/api/devices` POST endpoint for creating devices (ADMIN/OPERATOR only)
3. THE System SHALL provide a `/api/devices/[id]` PUT endpoint for updating devices (ADMIN/OPERATOR only)
4. THE System SHALL provide a `/api/devices/[id]` DELETE endpoint for deleting devices (ADMIN/OPERATOR only)
5. THE System SHALL provide a `/api/device/move` endpoint for updating device coordinates (ADMIN/OPERATOR only)
6. THE System SHALL provide a `/api/config` endpoint for system configuration (ADMIN only)
7. THE System SHALL provide a `/api/profile` endpoint for user password changes (all authenticated users)
8. WHEN an unauthorized user attempts to access a protected endpoint, THE System SHALL return a 403 Forbidden response
9. WHEN an unauthenticated user attempts to access any API endpoint, THE System SHALL return a 401 Unauthorized response
