"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initScheduler = initScheduler;
exports.updateSchedulerTray = updateSchedulerTray;
exports.startScheduler = startScheduler;
exports.stopScheduler = stopScheduler;
exports.isSchedulerRunning = isSchedulerRunning;
exports.getLastCaptureTime = getLastCaptureTime;
exports.captureNow = captureNow;
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
const work_hours_1 = require("./work-hours");
const tray_1 = require("./tray");
const state = {
    isRunning: false,
    intervalId: null,
    lastCaptureTime: null,
};
let mainWindow = null;
let store = null;
let tray = null;
/**
 * Initialize the screenshot scheduler with required references
 */
function initScheduler(window, electronStore, trayInstance) {
    mainWindow = window;
    store = electronStore;
    tray = trayInstance;
}
/**
 * Update tray reference (in case it changes)
 */
function updateSchedulerTray(trayInstance) {
    tray = trayInstance;
}
/**
 * Start the screenshot scheduler
 */
function startScheduler() {
    if (state.isRunning) {
        console.log('[Screenshot] Scheduler already running');
        return;
    }
    const config = store?.get('config');
    if (!config) {
        console.log('[Screenshot] No config found, cannot start scheduler');
        return;
    }
    const intervalMs = config.screenshotIntervalMinutes * 60 * 1000;
    console.log(`[Screenshot] Starting scheduler with ${config.screenshotIntervalMinutes} minute interval`);
    // Start the interval
    state.intervalId = setInterval(() => {
        checkAndCapture();
    }, intervalMs);
    state.isRunning = true;
    // Also check immediately on start
    checkAndCapture();
}
/**
 * Stop the screenshot scheduler
 */
function stopScheduler() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    state.isRunning = false;
    console.log('[Screenshot] Scheduler stopped');
}
/**
 * Check if scheduler is running
 */
function isSchedulerRunning() {
    return state.isRunning;
}
/**
 * Get the last capture time
 */
function getLastCaptureTime() {
    return state.lastCaptureTime;
}
/**
 * Check conditions and capture if valid
 */
async function checkAndCapture() {
    // Check consent
    const consent = store?.get('consent');
    if (!consent?.screenshotConsent) {
        console.log('[Screenshot] No screenshot consent, skipping');
        return;
    }
    // Check work hours
    const config = store?.get('config');
    if (!config) {
        console.log('[Screenshot] No config found, skipping');
        return;
    }
    if (!(0, work_hours_1.isWithinWorkHours)(config.workHours)) {
        console.log('[Screenshot] Outside work hours, skipping');
        return;
    }
    // Check monitoring state (don't capture if paused)
    const monitoringState = store?.get('monitoringState');
    if (monitoringState === shared_1.MonitoringState.PAUSED) {
        console.log('[Screenshot] Monitoring paused, skipping');
        return;
    }
    // Check server connection
    const serverConfig = store?.get('serverConfig');
    if (!serverConfig) {
        console.log('[Screenshot] No server config, skipping');
        return;
    }
    // Capture and upload
    await captureAndUpload();
}
/**
 * Capture screenshot and upload to server
 */
async function captureAndUpload() {
    try {
        console.log('[Screenshot] Starting capture...');
        // Update state to show capture in progress
        updateMonitoringState(shared_1.MonitoringState.SCREENSHOTS_ACTIVE);
        // Capture screenshot
        const screenshot = await captureScreen();
        // Upload to server
        await uploadScreenshot(screenshot);
        state.lastCaptureTime = new Date().toISOString();
        // Notify renderer of successful capture
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_SCREENSHOT_CAPTURED, {
            success: true,
            timestamp: state.lastCaptureTime,
        });
        console.log('[Screenshot] Capture and upload successful');
        // Revert state after brief delay (show yellow tray momentarily)
        setTimeout(() => {
            const currentState = store?.get('monitoringState');
            if (currentState === shared_1.MonitoringState.SCREENSHOTS_ACTIVE) {
                updateMonitoringState(shared_1.MonitoringState.IDLE);
            }
        }, 2000);
    }
    catch (error) {
        console.error('[Screenshot] Capture failed:', error);
        // Notify renderer of failure
        mainWindow?.webContents.send(shared_1.IpcChannels.ON_SCREENSHOT_CAPTURED, {
            success: false,
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Revert state on error
        updateMonitoringState(shared_1.MonitoringState.IDLE);
    }
}
/**
 * Capture the primary screen
 */
async function captureScreen() {
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor;
    // Get screen sources
    const sources = await electron_1.desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
            width: Math.floor(width * scaleFactor),
            height: Math.floor(height * scaleFactor),
        },
    });
    if (sources.length === 0) {
        throw new Error('No screen sources available');
    }
    // Get the primary display source (usually the first one)
    const primarySource = sources[0];
    const thumbnail = primarySource.thumbnail;
    // Convert to PNG buffer
    return thumbnail.toPNG();
}
/**
 * Upload screenshot to the server
 */
async function uploadScreenshot(imageBuffer) {
    const serverConfig = store?.get('serverConfig');
    const config = store?.get('config');
    const machineId = store?.get('machineId');
    const serverUrl = `http://${serverConfig.host}:${serverConfig.port}`;
    // Create form data manually for Node.js environment
    const boundary = `----FormBoundary${Date.now()}`;
    const timestamp = new Date().toISOString();
    const filename = `screenshot-${Date.now()}.png`;
    // Build multipart form data
    const parts = [];
    // Add machineId field
    parts.push(Buffer.from(`--${boundary}\r\n` +
        `Content-Disposition: form-data; name="machineId"\r\n\r\n` +
        `${machineId}\r\n`));
    // Add userName field
    parts.push(Buffer.from(`--${boundary}\r\n` +
        `Content-Disposition: form-data; name="userName"\r\n\r\n` +
        `${config.userName || 'Unknown'}\r\n`));
    // Add timestamp field
    parts.push(Buffer.from(`--${boundary}\r\n` +
        `Content-Disposition: form-data; name="timestamp"\r\n\r\n` +
        `${timestamp}\r\n`));
    // Add screenshot file
    parts.push(Buffer.from(`--${boundary}\r\n` +
        `Content-Disposition: form-data; name="screenshot"; filename="${filename}"\r\n` +
        `Content-Type: image/png\r\n\r\n`));
    parts.push(imageBuffer);
    parts.push(Buffer.from('\r\n'));
    // Add closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));
    // Combine all parts
    const body = Buffer.concat(parts);
    // Make the request using native fetch (available in Node 18+)
    const response = await fetch(`${serverUrl}/api/screenshots/upload`, {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: body,
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${text}`);
    }
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.error || 'Upload failed');
    }
    console.log(`[Screenshot] Uploaded successfully: ${result.screenshotId}`);
}
/**
 * Update monitoring state and notify tray/renderer
 */
function updateMonitoringState(newState) {
    store?.set('monitoringState', newState);
    (0, tray_1.updateTrayState)(tray, newState);
    mainWindow?.webContents.send(shared_1.IpcChannels.ON_STATE_CHANGE, newState);
}
/**
 * Capture a screenshot immediately (manual trigger)
 */
async function captureNow() {
    // Check consent first
    const consent = store?.get('consent');
    if (!consent?.screenshotConsent) {
        throw new Error('Screenshot consent not given');
    }
    // Check server config
    const serverConfig = store?.get('serverConfig');
    if (!serverConfig) {
        throw new Error('Server not configured');
    }
    await captureAndUpload();
}
//# sourceMappingURL=screenshot-scheduler.js.map