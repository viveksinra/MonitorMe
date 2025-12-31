# MonitorMe - Office Screen Monitoring Application

A **consent-first, transparent** office monitoring application built with Electron.js that enables admins to view employee screens and receive periodic screenshots - all with explicit user awareness and consent.

## ⚡ TL;DR - Quick Start (Testing on One PC)

```bash
# 1. Install dependencies
npm install

# 2. Build everything
npm run build

# 3. Start everything (server + user-app + admin-app)
npm run start:all
```

**First time setup:**
- **Admin App:** Login with `admin` / `admin`, then connect to `localhost:3000`
- **User App:** Accept consent form, then connect to `localhost:3000`
- **Test live viewing** by viewing your own screen from the admin dashboard!

**To stop:** Press `Ctrl+C` in the terminal

---

## 🚀 Full Installation Guide

### Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** 9 or higher (comes with Node.js)
- **Windows/Mac/Linux** operating system

### Installation

1. **Clone the repository** (or extract the project files)
   ```bash
   cd MonitorMe
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

   This will install dependencies for all packages (shared, server, user-app, admin-app).

3. **Build all packages**
   ```bash
   npm run build
   ```

   This compiles TypeScript and builds all applications.

## 🎯 Running the Application

### ⚡ Quick Start - Single Command (Recommended for Testing)

**Yes, you can run everything on one PC for testing!**

To start the server, user app, and admin app all at once:

```bash
npm run start:all
```

This will launch all three components in color-coded terminal output:
- 🔵 **SERVER** - Signaling server on port 3000
- 🟢 **USER** - User application (Electron window)
- 🟣 **ADMIN** - Admin application (Electron window)

**Wait for:**
- Server to show network addresses (e.g., `http://192.168.1.13:3000`)
- Both Electron windows to open

**For testing on one PC, use `localhost:3000` as the server address in both apps.**

**To stop all:** Press `Ctrl+C` in the terminal (kills all processes)

---

### 📋 Manual Start (Alternative)

You need to run **three components** for the system to work:

### 1. Start the Signaling Server

The server coordinates communication between user and admin applications.

```bash
cd packages/server
npm start
```

**Expected Output:**
```
═══════════════════════════════════════════════════════
         MonitorMe Signaling Server Started
═══════════════════════════════════════════════════════

  Port: 3000

  Connect using one of these addresses:

    Local:    http://localhost:3000
    Network:  http://192.168.1.13:3000  ← Use this for LAN

  Waiting for connections...
```

**📝 Note the Network address** (e.g., `192.168.1.13:3000`) - you'll need this to connect the apps.

---

### 2. Start the User Application (Employee Side)

Open a **new terminal window**:

```bash
cd packages/user-app
npm start
```

This will:
- Build the application
- Launch the Electron window

**First Launch:**
1. Read and accept the consent form
2. Configure your work hours
3. Enter the server address (from Step 1)
4. Click "Connect to Server"

**Tray Icon:**
- A tray icon will appear in your system tray showing monitoring status
- **Green** = Idle, **Yellow** = Screenshots active, **Red** = Live viewing, **Gray** = Paused

---

### 3. Start the Admin Application

Open **another new terminal window**:

```bash
cd packages/admin-app
npm start
```

This will:
- Build the application
- Launch the Electron window

**Setup:**
1. Enter the same server address (e.g., `192.168.1.13:3000`)
2. Click "Connect to Server"
3. You'll see connected users in the dashboard

---

## 🧪 Testing the Features

### 🖥️ Testing on One PC

**Perfect for development and testing!** Here's how:

1. **Run everything:**
   ```bash
   npm run start:all
   ```
   Wait for all three components to start (server + 2 Electron windows)

2. **Admin App - Login:**
   - You'll see a login screen
   - Username: `admin`
   - Password: `admin`
   - Click "Sign In"

3. **Admin App - Connect to Server:**
   - Enter server address: `localhost:3000`
   - Click "Connect to Server"
   - Status should change to "Connected"

4. **User App - First Launch (Consent):**
   - Read the consent form
   - Check all three consent boxes
   - Click "I Agree"
   - Configure work hours (optional, defaults to 9 AM - 6 PM, Mon-Fri)

5. **User App - Connect to Server:**
   - Enter server address: `localhost:3000`
   - Click "Connect to Server"
   - Tray icon will appear in system tray

6. **Test Live Viewing:**
   - In Admin dashboard, you'll see your user account listed
   - Click "View Screen" next to your user
   - In User app, accept the view request
   - Your screen will appear in the Admin app
   - Notice your tray icon turns RED during viewing

**Both apps run side-by-side on the same machine** for easy testing!

---

### Test 1: Periodic Screenshots

1. **User App:** Ensure work hours are configured and screenshots are enabled
2. Wait for the configured interval (default: 15 minutes)
3. Screenshots are automatically captured and uploaded
4. **Admin App:** View screenshots in the timeline

**Manual Screenshot:**
- User App → Settings → "Capture Screenshot Now" button

---

### Test 2: Live Screen Viewing (WebRTC)

1. **Admin App:**
   - Locate a connected user in the dashboard
   - Click the **"View Screen"** button

2. **User App:**
   - A dialog will appear: "*Admin is requesting to view your screen*"
   - You'll see a warning: "Your tray icon will turn RED during the session"
   - Click **"Accept"** or **"Reject"**

3. **If Accepted:**
   - Admin sees your screen in real-time (720p @ 30fps)
   - User's tray icon turns **RED**
   - Both can end the session anytime

4. **End Session:**
   - Admin: Click "End Session" in the live view modal
   - User: Right-click tray → "End Live View"

---

## 📁 Project Structure

```
MonitorMe/
├── packages/
│   ├── shared/              # Shared TypeScript types and constants
│   ├── server/              # Signaling server (Socket.io + HTTP)
│   ├── user-app/            # Employee Electron application
│   └── admin-app/           # Admin Electron application
├── package.json             # Root workspace configuration
├── README.md                # This file
└── planReadme.md            # Detailed implementation plan
```

---

## 🛠️ Development Commands

### Root Directory

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run build` | Build all packages |
| **`npm run start:all`** | **🚀 Start server + user-app + admin-app (single command)** |
| `npm run start:server` | Start server only |
| `npm run start:user` | Start user app only |
| `npm run start:admin` | Start admin app only |
| `npm run build -w @monitor-me/shared` | Build shared package only |
| `npm run build -w @monitor-me/server` | Build server only |
| `npm run build -w @monitor-me/user-app` | Build user app only |
| `npm run build -w @monitor-me/admin-app` | Build admin app only |

### Server (packages/server)

| Command | Description |
|---------|-------------|
| `npm start` | Start the signaling server |
| `npm run build` | Build server TypeScript |

### User App (packages/user-app)

| Command | Description |
|---------|-------------|
| `npm start` | Build and run in Electron |
| `npm run build` | Build for production |
| `npm run dev` | Start Vite dev server (UI only) |

### Admin App (packages/admin-app)

| Command | Description |
|---------|-------------|
| `npm start` | Build and run in Electron |
| `npm run build` | Build for production |
| `npm run dev` | Start Vite dev server (UI only) |

---

## 🔧 Troubleshooting

### Server won't start - "Port 3000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill //PID <PID_NUMBER> //F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

Or use a different port:
```bash
PORT=3001 npm start
```

---

### Apps won't connect to server

**Checklist:**
1. ✅ Server is running and showing network addresses
2. ✅ Using the correct network address (not localhost)
3. ✅ All devices are on the same LAN
4. ✅ Firewall allows port 3000

**Test the server:**
```bash
curl http://192.168.1.13:3000/health
```

Should return:
```json
{"status":"ok","timestamp":"...","screenshots":0,"users":0}
```

---

### Build errors after pulling updates

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
npm run build
```

---

### Vite build errors about missing exports

**Solution:**
```bash
# Clear Vite cache
rm -rf packages/user-app/node_modules/.vite
rm -rf packages/admin-app/node_modules/.vite

# Rebuild shared package
cd packages/shared
rm -rf dist
npm run build
```

---

### Electron window doesn't open

**Check terminal output for errors:**
- Look for TypeScript compilation errors
- Check for missing dependencies
- Verify dist-electron folder exists

**Rebuild:**
```bash
npm run build
npm start
```

---

### Blank page or "module not found" errors in Electron apps

**Symptoms:**
- Admin or User app window shows blank page
- Console error: "Unable to load preload script"
- Console error: "module not found: @monitor-me/shared"
- Console error: "Cannot read properties of undefined (reading 'getServerConfig')"

**Root Cause:**
Electron's sandbox mode on Windows can prevent preload scripts from resolving npm workspace packages.

**Solution:**
This has been fixed in the codebase by disabling sandbox mode for preload scripts while maintaining contextIsolation. The apps use:
```typescript
webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false, // Disabled to allow workspace package resolution
}
```

If you still encounter this issue:
1. **Kill all Electron processes:**
   ```bash
   # Windows
   taskkill //F //IM electron.exe

   # Mac/Linux
   pkill -9 electron
   ```

2. **Rebuild both apps:**
   ```bash
   npm run build:user
   npm run build:admin
   ```

3. **Restart:**
   ```bash
   npm run start:all
   ```

**Note:** The sandbox is disabled for workspace package resolution, but contextIsolation remains enabled for security.

---

### WebSocket connection errors on app startup

**Symptoms:**
- Console shows "websocket error" messages when apps first start
- Connection status shows "error" briefly

**Explanation:**
This is normal behavior. The apps attempt to auto-connect to the last saved server address on startup. If you haven't configured a server yet, or the server isn't running, you'll see connection errors.

**Solution:**
1. Make sure the server is running: `npm run start:server`
2. In the app, enter server address (e.g., `localhost:3000`)
3. Click "Connect to Server"

The errors will stop once successfully connected.

---

### Admin app login credentials

**For testing:**
- Username: `admin`
- Password: `admin`

This is a placeholder login for Phase 1-4. Full authentication will be implemented in Phase 5.

---

## 🔒 Security & Privacy

### Consent-First Design

- ✅ **Explicit consent** required before any monitoring
- ✅ **Visible indicators** at all times (tray icon colors)
- ✅ **User control** to pause/resume monitoring
- ✅ **Manual acceptance** required for live viewing
- ✅ **No hidden monitoring** - everything is transparent

### Data Storage

- Screenshots stored locally: `packages/server/screenshots/`
- User preferences: Electron's app data directory
- **No cloud upload** - everything stays on LAN

### Network Security

- ✅ **LAN-only** communication
- ✅ **No internet** required
- ✅ **Direct P2P** for video (WebRTC)
- ✅ Server only relays signaling

---

## 📊 Features Implemented

### ✅ Phase 1: Foundation & Consent
- Monorepo structure with TypeScript
- Explicit consent system
- Tray icon status indicators
- Work hours configuration

### ✅ Phase 2: Real-time Communication
- Socket.io signaling server
- User registry and online status
- Admin-User messaging
- Connection management

### ✅ Phase 3: Periodic Screenshots
- Screen capture with work hours enforcement
- Automatic upload to server
- Screenshot timeline view
- Storage and retrieval system

### ✅ Phase 4: Live Screen Viewing (WebRTC)
- Admin-initiated view requests
- User acceptance/rejection dialog
- 720p @ 30fps live video streaming
- Session tracking and conflict prevention
- Bidirectional disconnect support

### ⏳ Phase 5: Production Polish (Pending)
- Enhanced pause/resume UI
- Admin session audit logs
- Advanced error handling
- Admin authentication

---

## 📝 Configuration Files

### Work Hours (User App Settings)

```typescript
{
  startHour: 9,        // 9:00 AM
  startMinute: 0,
  endHour: 18,         // 6:00 PM
  endMinute: 0,
  activeDays: [1, 2, 3, 4, 5]  // Monday-Friday
}
```

### Screenshot Interval

Default: **15 minutes**

Configurable in User App settings.

---

## 🎨 Tray Icon Color Guide

| Color | State | Description |
|-------|-------|-------------|
| 🟢 **Green** | Idle | No monitoring active |
| 🟡 **Yellow** | Screenshots Active | Periodic screenshots running |
| 🔴 **Red** | Live View Active | Admin is viewing your screen |
| ⚪ **Gray** | Paused | Monitoring paused by user |

---

## 🤝 Contributing

This project is built for **internal office use**. Key principles:
- **Transparency first** - No hidden monitoring
- **Consent required** - User must explicitly agree
- **LAN-only** - No cloud dependencies
- **Type-safe** - TypeScript throughout

---

## 📄 License

Internal office project - all rights reserved.

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `planReadme.md` for detailed implementation info
3. Check terminal output for error messages
4. Verify all three components (server, user-app, admin-app) are running

---

## 🎯 Next Steps

After successful setup:

1. **Test on LAN** - Run on multiple machines
2. **Configure work hours** - Adjust to your office schedule
3. **Test all features** - Screenshots and live viewing
4. **Customize settings** - Screenshot intervals, etc.

**System is ready for use!** 🚀
