import { Tray, Menu, nativeImage, app, ipcMain } from 'electron';
import { MonitoringState, StatusMessages, IpcChannels, APP_NAME } from '@monitor-me/shared';
import { setAppQuitting } from './types';

// Store the showWindow callback for menu rebuilding
let showWindowCallback: (() => void) | null = null;

/**
 * Create a simple colored icon as nativeImage
 * In production, you'd use actual icon files
 */
function createColoredIcon(state: MonitoringState): Electron.NativeImage {
  // For now, create a simple 16x16 colored icon
  // In production, you should use proper icon files
  const colors = {
    [MonitoringState.IDLE]: '#22c55e', // green
    [MonitoringState.SCREENSHOTS_ACTIVE]: '#eab308', // yellow
    [MonitoringState.LIVE_VIEW_ACTIVE]: '#ef4444', // red
    [MonitoringState.PAUSED]: '#9ca3af', // gray
  };

  const color = colors[state] || colors[MonitoringState.IDLE];

  // Create a simple square icon (16x16)
  // This is a placeholder - in production use proper .ico/.png files
  const size = 16;
  const canvas = Buffer.alloc(size * size * 4);

  // Parse hex color
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  for (let i = 0; i < size * size; i++) {
    const offset = i * 4;
    canvas[offset] = r; // R
    canvas[offset + 1] = g; // G
    canvas[offset + 2] = b; // B
    canvas[offset + 3] = 255; // A
  }

  return nativeImage.createFromBuffer(canvas, { width: size, height: size });
}

/**
 * Build the context menu for the tray
 */
function buildContextMenu(
  state: MonitoringState,
  showWindow: () => void
): Electron.Menu {
  const isPaused = state === MonitoringState.PAUSED;
  const statusText = StatusMessages[state];

  return Menu.buildFromTemplate([
    {
      label: statusText,
      enabled: false,
      icon: createColoredIcon(state),
    },
    { type: 'separator' },
    {
      label: 'Open MonitorMe',
      click: showWindow,
    },
    { type: 'separator' },
    {
      label: isPaused ? 'Resume Monitoring' : 'Pause Monitoring',
      click: () => {
        if (isPaused) {
          ipcMain.emit(IpcChannels.RESUME_MONITORING);
        } else {
          ipcMain.emit(IpcChannels.PAUSE_MONITORING);
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        setAppQuitting(true);
        app.quit();
      },
    },
  ]);
}

/**
 * Create the system tray icon
 */
export function createTray(showWindow: () => void): Tray {
  // Store the callback for later use in updateTrayState
  showWindowCallback = showWindow;

  const icon = createColoredIcon(MonitoringState.IDLE);
  const tray = new Tray(icon);

  tray.setToolTip(`${APP_NAME} - ${StatusMessages[MonitoringState.IDLE]}`);
  tray.setContextMenu(buildContextMenu(MonitoringState.IDLE, showWindow));

  // Double-click to show window
  tray.on('double-click', showWindow);

  return tray;
}

/**
 * Update the tray icon and menu for a new state
 */
export function updateTrayState(tray: Tray | null, state: MonitoringState): void {
  if (!tray) return;

  const icon = createColoredIcon(state);

  tray.setImage(icon);
  tray.setToolTip(`${APP_NAME} - ${StatusMessages[state]}`);

  // Rebuild the context menu to update the pause/resume label
  if (showWindowCallback) {
    tray.setContextMenu(buildContextMenu(state, showWindowCallback));
  }
}

/**
 * Destroy the tray icon
 */
export function destroyTray(tray: Tray | null): void {
  if (tray) {
    tray.destroy();
  }
  // Clear the stored callback
  showWindowCallback = null;
}
