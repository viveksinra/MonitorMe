import { desktopCapturer, screen, BrowserWindow } from 'electron';
import Store from 'electron-store';
import {
  MonitoringState,
  IpcChannels,
  type AppConfig,
  type ConsentData,
  type ServerConfig,
} from '@monitor-me/shared';
import { isWithinWorkHours } from './work-hours';
import { updateTrayState } from './tray';

interface SchedulerState {
  isRunning: boolean;
  intervalId: NodeJS.Timeout | null;
  lastCaptureTime: string | null;
}

const state: SchedulerState = {
  isRunning: false,
  intervalId: null,
  lastCaptureTime: null,
};

let mainWindow: BrowserWindow | null = null;
let store: Store | null = null;
let tray: Electron.Tray | null = null;

/**
 * Initialize the screenshot scheduler with required references
 */
export function initScheduler(
  window: BrowserWindow,
  electronStore: Store,
  trayInstance: Electron.Tray | null
): void {
  mainWindow = window;
  store = electronStore;
  tray = trayInstance;
}

/**
 * Update tray reference (in case it changes)
 */
export function updateSchedulerTray(trayInstance: Electron.Tray | null): void {
  tray = trayInstance;
}

/**
 * Start the screenshot scheduler
 */
export function startScheduler(): void {
  if (state.isRunning) {
    console.log('[Screenshot] Scheduler already running');
    return;
  }

  const config = store?.get('config') as AppConfig | undefined;
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
export function stopScheduler(): void {
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
export function isSchedulerRunning(): boolean {
  return state.isRunning;
}

/**
 * Get the last capture time
 */
export function getLastCaptureTime(): string | null {
  return state.lastCaptureTime;
}

/**
 * Check conditions and capture if valid
 */
async function checkAndCapture(): Promise<void> {
  // Check consent
  const consent = store?.get('consent') as ConsentData | null;
  if (!consent?.screenshotConsent) {
    console.log('[Screenshot] No screenshot consent, skipping');
    return;
  }

  // Check work hours
  const config = store?.get('config') as AppConfig | undefined;
  if (!config) {
    console.log('[Screenshot] No config found, skipping');
    return;
  }

  if (!isWithinWorkHours(config.workHours)) {
    console.log('[Screenshot] Outside work hours, skipping');
    return;
  }

  // Check monitoring state (don't capture if paused)
  const monitoringState = store?.get('monitoringState') as MonitoringState;
  if (monitoringState === MonitoringState.PAUSED) {
    console.log('[Screenshot] Monitoring paused, skipping');
    return;
  }

  // Check server connection
  const serverConfig = store?.get('serverConfig') as ServerConfig | undefined;
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
async function captureAndUpload(): Promise<void> {
  try {
    console.log('[Screenshot] Starting capture...');

    // Update state to show capture in progress
    updateMonitoringState(MonitoringState.SCREENSHOTS_ACTIVE);

    // Capture screenshot
    const screenshot = await captureScreen();

    // Upload to server
    await uploadScreenshot(screenshot);

    state.lastCaptureTime = new Date().toISOString();

    // Notify renderer of successful capture
    mainWindow?.webContents.send(IpcChannels.ON_SCREENSHOT_CAPTURED, {
      success: true,
      timestamp: state.lastCaptureTime,
    });

    console.log('[Screenshot] Capture and upload successful');

    // Revert state after brief delay (show yellow tray momentarily)
    setTimeout(() => {
      const currentState = store?.get('monitoringState') as MonitoringState;
      if (currentState === MonitoringState.SCREENSHOTS_ACTIVE) {
        updateMonitoringState(MonitoringState.IDLE);
      }
    }, 2000);
  } catch (error) {
    console.error('[Screenshot] Capture failed:', error);

    // Notify renderer of failure
    mainWindow?.webContents.send(IpcChannels.ON_SCREENSHOT_CAPTURED, {
      success: false,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Revert state on error
    updateMonitoringState(MonitoringState.IDLE);
  }
}

/**
 * Capture the primary screen
 */
async function captureScreen(): Promise<Buffer> {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;
  const scaleFactor = primaryDisplay.scaleFactor;

  // Get screen sources
  const sources = await desktopCapturer.getSources({
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
async function uploadScreenshot(imageBuffer: Buffer): Promise<void> {
  const serverConfig = store?.get('serverConfig') as ServerConfig;
  const config = store?.get('config') as AppConfig;
  const machineId = store?.get('machineId') as string;

  const serverUrl = `http://${serverConfig.host}:${serverConfig.port}`;

  // Create form data manually for Node.js environment
  const boundary = `----FormBoundary${Date.now()}`;
  const timestamp = new Date().toISOString();
  const filename = `screenshot-${Date.now()}.png`;

  // Build multipart form data
  const parts: Buffer[] = [];

  // Add machineId field
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="machineId"\r\n\r\n` +
    `${machineId}\r\n`
  ));

  // Add userName field
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="userName"\r\n\r\n` +
    `${config.userName || 'Unknown'}\r\n`
  ));

  // Add timestamp field
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="timestamp"\r\n\r\n` +
    `${timestamp}\r\n`
  ));

  // Add screenshot file
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="screenshot"; filename="${filename}"\r\n` +
    `Content-Type: image/png\r\n\r\n`
  ));
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
function updateMonitoringState(newState: MonitoringState): void {
  store?.set('monitoringState', newState);
  updateTrayState(tray, newState);
  mainWindow?.webContents.send(IpcChannels.ON_STATE_CHANGE, newState);
}

/**
 * Capture a screenshot immediately (manual trigger)
 */
export async function captureNow(): Promise<void> {
  // Check consent first
  const consent = store?.get('consent') as ConsentData | null;
  if (!consent?.screenshotConsent) {
    throw new Error('Screenshot consent not given');
  }

  // Check server config
  const serverConfig = store?.get('serverConfig') as ServerConfig | undefined;
  if (!serverConfig) {
    throw new Error('Server not configured');
  }

  await captureAndUpload();
}
