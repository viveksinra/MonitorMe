# Office Screen Monitoring Electron App

## Overview

This project is an **internal office desktop application** built using **Electron.js** that allows an **Admin** to:

* View employee screens live (with explicit awareness)
* Receive periodic screenshots during work hours (with upfront consent)

The application is designed to work **entirely within the same local network (LAN)**. **No public cloud deployment is required.** All communication happens directly between machines via a lightweight **local signaling service**.

The system is **consent-first, transparent, and ethical**. At no point does the app perform hidden monitoring.

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Electron.js |
| **Package Manager** | npm (with workspaces) |
| **Language** | TypeScript |
| **UI Framework** | React 18+ |
| **Styling** | Tailwind CSS |
| **Build Tool** | Vite |
| **Local Storage** | electron-store |
| **Packaging** | electron-builder |

---

## Project Structure

```
MonitorMe/
├── package.json                 # Root workspace config
├── tsconfig.json               # Base TypeScript config
├── packages/
│   ├── shared/                 # Shared types, utils, constants
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts        # Shared TypeScript interfaces
│   │       ├── constants.ts    # Work hours, intervals config
│   │       └── index.ts
│   │
│   ├── user-app/               # Employee Electron app
│   │   ├── package.json
│   │   ├── electron/
│   │   │   ├── main.ts         # Electron main process
│   │   │   ├── preload.ts      # Preload script
│   │   │   └── tray.ts         # Tray icon management
│   │   └── src/
│   │       ├── App.tsx
│   │       ├── main.tsx
│   │       └── components/
│   │           └── ConsentScreen.tsx
│   │
│   └── admin-app/              # Admin Electron app
│       ├── package.json
│       ├── electron/
│       │   ├── main.ts
│       │   └── preload.ts
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           └── components/
│               └── Dashboard.tsx
```

---

## Key Principles (Non-Negotiable)

* Explicit upfront user consent
* Continuous visible monitoring indicators
* Ability for users to pause/stop monitoring
* Monitoring restricted to configured work hours
* Admin access is authenticated
* Works only inside the same network (LAN)

---

## High-Level Architecture

```
┌────────────┐       ┌──────────────────┐
│ Admin App  │◄─────►│ Local Signaling   │
└────────────┘       │ Server (Node.js)  │
       ▲             └──────────────────┘
       │
       │ WebRTC (P2P)
       │
┌────────────┐
│ User App   │
└────────────┘
```

### Components

1. **Admin Electron App** - used by managers
2. **User Electron App** - installed on employee machines
3. **Local Signaling Server** - runs on one machine inside the network

> Media (screen/video/audio) flows **directly between Admin and User machines** using WebRTC. The server is used **only for signaling and coordination**.

---

## Core Features

### User App

* Signup / first-launch consent screen
* Tray-based monitoring indicator
* Periodic screenshot capture (work hours only)
* Live screen sharing (WebRTC)
* Pause / resume monitoring
* Clear status messages

### Admin App

* Login (admin-only)
* View online users in LAN
* Request live screen view
* View screenshot timeline per user
* Disconnect live sessions

### Signaling Server

* Maintain online user registry
* Relay WebRTC offers/answers/ICE candidates
* Dispatch admin requests to users
* No media handling

---

## Consent Model

Consent is taken **once during signup**, but visibility is **continuous**.

### Explicit Permissions

* Periodic screenshots during work hours
* Admin-requested live screen viewing

### Mandatory Visibility

* Tray icon indicating monitoring state
* Real-time status text (e.g. "Admin is watching your screen")
* User can pause monitoring at any time

---

## Monitoring States

| State              | Tray Indicator | Description                  |
| ------------------ | -------------- | ---------------------------- |
| Idle               | Green          | No monitoring                |
| Screenshots Active | Yellow         | Periodic screenshots running |
| Live View Active   | Red            | Admin watching screen        |
| Paused             | Gray           | Monitoring paused by user    |

---

## Project Phases

### Phase Completion Status

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1 - Foundation & Consent | ✅ COMPLETED | 100% |
| Phase 2 - Real-time Communication | ✅ COMPLETED | 100% |
| Phase 3 - Periodic Screenshot System | ✅ COMPLETED | 100% |
| Phase 4 - Live Screen Viewing (WebRTC) | ✅ COMPLETED | 100% |
| Phase 5 - Controls, Safety & Polish | ⏳ PENDING | 0% |

---

## Phase 1 - Foundation & Consent ✅

### Status: COMPLETED (100%)

### Goal

Set up the base Electron apps and consent system.

### Deliverables

* Monorepo structure with npm workspaces
* Shared package with types and constants
* Electron boilerplate (Admin & User apps)
* App configuration (work hours, screenshot interval)
* Consent UI with explicit checkboxes
* Store consent locally using electron-store
* Basic tray icon with status indicators

### Implementation Details

**Consent Screen Requirements:**
- Clear explanation of what monitoring entails
- Three explicit checkboxes:
  1. "I consent to periodic screenshots during work hours"
  2. "I consent to admin-initiated live screen viewing"
  3. "I understand monitoring indicators will always be visible"
- "I Agree" button only enabled when all boxes checked
- Consent stored locally and optionally synced to server

**Tray Icon Features:**
- Visual status indicator (colored icon)
- Context menu with status, pause/resume, and quit options
- Tooltip showing current monitoring state

### Completed Features

✅ Monorepo structure with npm workspaces
✅ Shared package with types, constants, and socket events
✅ Electron boilerplate for both Admin & User apps
✅ App configuration with work hours and screenshot intervals
✅ Consent UI with explicit checkboxes and clear messaging
✅ Local storage using electron-store
✅ Tray icon with colored status indicators (Green/Yellow/Red/Gray)
✅ Context menu with pause/resume and quit options
✅ **BUG FIX**: Tray menu now properly updates when monitoring state changes

### Notes

* Focus on UX clarity and legal transparency achieved
* All consent mechanisms working properly

---

## Phase 2 - Real-time Communication ✅

### Status: COMPLETED (100%)

### Goal

Enable discovery and communication inside LAN.

### Deliverables

* Node.js signaling server (WebSocket-based)
* Online user registry
* Admin <-> User request messaging
* Role-based identification (admin vs user)

### Completed Features

✅ Socket.io-based signaling server
✅ HTTP server for screenshot uploads and retrieval
✅ User registry system with online/offline status tracking
✅ Admin and User registration with unique IDs
✅ Real-time user state synchronization
✅ Bidirectional messaging between Admin and Users
✅ Connection status management (Connected/Disconnected/Error states)
✅ Server displays all network addresses for easy LAN connection

### Notes

* Server runs only on LAN (port 3000)
* No cloud or public IP usage
* Multipart form data parser for screenshot uploads

---

## Phase 3 - Periodic Screenshot System ✅

### Status: COMPLETED (100%)

### Goal

Implement consent-based screenshot capture.

### Deliverables

* Screen capture using Electron `desktopCapturer`
* Fixed-interval scheduler (e.g. 15 minutes)
* Work-hours enforcement
* Tray indicator update when capture happens
* Upload screenshots to local server

### Admin Side

* Screenshot timeline view
* Timestamped entries

### Completed Features

✅ Screen capture using Electron `desktopCapturer` API
✅ Configurable screenshot interval (default: 15 minutes)
✅ Work hours enforcement with active days configuration
✅ Screenshot scheduler with automatic start/stop
✅ Tray indicator updates during screenshot capture
✅ Screenshot upload to local server via HTTP POST
✅ Server-side screenshot storage system with file management
✅ Screenshot metadata tracking (timestamp, user, machine ID)
✅ Admin dashboard displays screenshot availability notifications
✅ Screenshot retrieval API endpoints
✅ Basic screenshot timeline view (ScreenshotTimeline component)

### Known Limitations

* Screenshot metadata currently stored in-memory (could be enhanced with database persistence)
* Basic retry mechanism for failed uploads could be improved

---

## Phase 4 - Live Screen Viewing (WebRTC) ✅

### Status: COMPLETED (100%)

### Goal

Enable admin to view user screens live with awareness.

### Deliverables

* Admin-initiated screen view request
* User-side notification & tray update
* WebRTC peer connection setup
* Live video rendering on admin app
* Manual disconnect support

### Rules

* No auto-connect
* No silent viewing
* Tray must be Red during live view

### Completed Features

✅ Admin-initiated screen view request system
✅ User-side view request dialog with accept/reject options
✅ WebRTC peer connection with native RTCPeerConnection API
✅ Screen capture at 720p @ 30fps for optimal LAN performance
✅ Live video rendering in admin app (LiveViewModal component)
✅ Manual disconnect support from both user and admin
✅ Tray icon turns RED during active live view session
✅ Session tracking to prevent multiple admins viewing same user
✅ WebRTC signaling through Socket.io server
✅ ICE candidate exchange (trickle ICE)
✅ Connection state tracking and error handling
✅ User consent validation before accepting view requests
✅ ViewRequestDialog shows admin name and warning about tray icon change
✅ No auto-reject timeout - user must manually accept/reject
✅ Both parties can end session at any time
✅ Proper cleanup on disconnect or session end

### Implementation Details

**User App (UserWebRTCManager):**
- Screen capture using desktopCapturer
- Creates WebRTC offer with screen stream
- Handles ICE candidates and connection state changes
- Automatic cleanup on errors

**Admin App (AdminWebRTCManager):**
- Receives WebRTC offer from user
- Creates and sends answer
- Displays remote video stream in full-screen modal
- Real-time connection state updates

**Server:**
- Relays WebRTC signaling messages (offers, answers, ICE candidates)
- Maintains active session registry
- Prevents concurrent viewing sessions
- Notifies both parties on disconnect

### Technical Stack

- Native RTCPeerConnection (no external WebRTC library)
- Google STUN server (stun:stun.l.google.com:19302)
- User creates offer (cleaner flow since user has media stream)
- 720p resolution @ 30fps for balanced quality on LAN

---

## Phase 5 - Controls, Safety & Polish ⏳

### Status: PENDING (0%)

### Goal

Make the system production-safe for office use.

### Deliverables

* Pause / resume monitoring button (user)
* Admin session logs (who viewed whom, when)
* Error handling & reconnect logic
* Performance optimization (frame rate limits)
* Basic authentication for admin

---

## Getting Started

### Prerequisites

* Node.js 18+
* npm 9+

### Development Setup

```bash
# Clone the repository
git clone <repo-url>
cd MonitorMe

# Install dependencies
npm install

# Run User App in development
npm run dev:user

# Run Admin App in development
npm run dev:admin

# Build for production
npm run build
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:user` | Start User App in dev mode |
| `npm run dev:admin` | Start Admin App in dev mode |
| `npm run build` | Build all packages |
| `npm run build:user` | Build User App |
| `npm run build:admin` | Build Admin App |
| `npm start` (in packages/server) | Start signaling server |
| `npm start` (in packages/user-app) | Build and run user app |
| `npm start` (in packages/admin-app) | Build and run admin app |

---

## Implementation Summary

### ✅ Completed (Phases 1-4)

**Core Functionality:**
- ✅ Electron-based monorepo with workspaces
- ✅ Explicit user consent system with checkboxes
- ✅ Real-time tray icon status indicators
- ✅ Socket.io signaling server for LAN communication
- ✅ User registry and connection management
- ✅ Periodic screenshot capture with work hours enforcement
- ✅ Screenshot storage and retrieval system
- ✅ WebRTC-based live screen viewing
- ✅ User acceptance/rejection of view requests
- ✅ Session tracking and conflict prevention
- ✅ Full bidirectional disconnect support

**Technical Achievements:**
- TypeScript throughout with strict type checking
- React 18+ with Tailwind CSS for UI
- Vite build system with CommonJS/ES module compatibility
- Native WebRTC implementation (no external libraries)
- Electron IPC with contextBridge for security
- electron-store for persistent configuration

### ⏳ Remaining (Phase 5)

**Enhancements Needed:**
- ⏳ Enhanced pause/resume monitoring UI
- ⏳ Admin session audit logs
- ⏳ Advanced error handling and auto-reconnect
- ⏳ Performance optimizations (frame rate controls)
- ⏳ Admin authentication system
- ⏳ Database persistence for screenshot metadata
- ⏳ Screenshot upload retry mechanism

### 🎯 Current State

The MonitorMe application is **functionally complete** for core monitoring tasks. All primary features are working:
- Users can consent and be monitored
- Periodic screenshots are captured and stored
- Admins can view live screens with user awareness
- All visibility and consent requirements are met

Phase 5 focuses on **production hardening** and **operational safety** for actual office deployment.

---

## Testing the Application

### Starting the System

1. **Start the Signaling Server:**
   ```bash
   cd packages/server
   npm start
   ```
   Server will display LAN addresses (e.g., `http://192.168.1.13:3000`)

2. **Start the User App:**
   ```bash
   cd packages/user-app
   npm start
   ```
   - Accept consent on first launch
   - Connect to server using LAN address
   - Check tray icon for status

3. **Start the Admin App:**
   ```bash
   cd packages/admin-app
   npm start
   ```
   - Connect to server using same LAN address
   - View connected users in dashboard

### Testing Live View

1. In Admin App: Click **"View Screen"** next to a connected user
2. In User App: Accept or reject the view request dialog
3. If accepted: Admin sees live video, user's tray icon turns RED
4. Either party can end the session with **"End Session"** button

### Testing Screenshots

1. Configure work hours in User App settings
2. Screenshots captured automatically at configured intervals
3. Admin can view screenshot timeline in dashboard
4. Screenshots stored in `packages/server/screenshots/`
