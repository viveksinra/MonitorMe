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

---

## Phase 1 - Foundation & Consent

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

### Notes

* No screen capture yet
* Focus on UX clarity and legal transparency

---

## Phase 2 - Local Signaling Server

### Goal

Enable discovery and communication inside LAN.

### Deliverables

* Node.js signaling server (WebSocket-based)
* Online user registry
* Admin <-> User request messaging
* Role-based identification (admin vs user)

### Notes

* Server runs only on LAN
* No cloud or public IP usage

---

## Phase 3 - Periodic Screenshot System

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

---

## Phase 4 - Live Screen Viewing (WebRTC)

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

---

## Phase 5 - Controls, Safety & Polish

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
