"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.updateTrayState = updateTrayState;
exports.destroyTray = destroyTray;
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
const types_1 = require("./types");
/**
 * Create a simple colored icon as nativeImage
 * In production, you'd use actual icon files
 */
function createColoredIcon(state) {
    // For now, create a simple 16x16 colored icon
    // In production, you should use proper icon files
    const colors = {
        [shared_1.MonitoringState.IDLE]: '#22c55e', // green
        [shared_1.MonitoringState.SCREENSHOTS_ACTIVE]: '#eab308', // yellow
        [shared_1.MonitoringState.LIVE_VIEW_ACTIVE]: '#ef4444', // red
        [shared_1.MonitoringState.PAUSED]: '#9ca3af', // gray
    };
    const color = colors[state] || colors[shared_1.MonitoringState.IDLE];
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
    return electron_1.nativeImage.createFromBuffer(canvas, { width: size, height: size });
}
/**
 * Build the context menu for the tray
 */
function buildContextMenu(state, showWindow) {
    const isPaused = state === shared_1.MonitoringState.PAUSED;
    const statusText = shared_1.StatusMessages[state];
    return electron_1.Menu.buildFromTemplate([
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
                    electron_1.ipcMain.emit(shared_1.IpcChannels.RESUME_MONITORING);
                }
                else {
                    electron_1.ipcMain.emit(shared_1.IpcChannels.PAUSE_MONITORING);
                }
            },
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                (0, types_1.setAppQuitting)(true);
                electron_1.app.quit();
            },
        },
    ]);
}
/**
 * Create the system tray icon
 */
function createTray(showWindow) {
    const icon = createColoredIcon(shared_1.MonitoringState.IDLE);
    const tray = new electron_1.Tray(icon);
    tray.setToolTip(`${shared_1.APP_NAME} - ${shared_1.StatusMessages[shared_1.MonitoringState.IDLE]}`);
    tray.setContextMenu(buildContextMenu(shared_1.MonitoringState.IDLE, showWindow));
    // Double-click to show window
    tray.on('double-click', showWindow);
    return tray;
}
/**
 * Update the tray icon and menu for a new state
 */
function updateTrayState(tray, state) {
    if (!tray)
        return;
    const icon = createColoredIcon(state);
    tray.setImage(icon);
    tray.setToolTip(`${shared_1.APP_NAME} - ${shared_1.StatusMessages[state]}`);
    // We need to rebuild the menu to update the pause/resume option
    // Store the showWindow callback when creating the tray
    // For now, we'll emit an event to get the window reference
}
/**
 * Destroy the tray icon
 */
function destroyTray(tray) {
    if (tray) {
        tray.destroy();
    }
}
//# sourceMappingURL=tray.js.map