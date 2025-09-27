import { app, BrowserWindow } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { startAdvertisement } from '../src/advertise.js';
import { DEFAULT_AGENT_PORT } from '@monitorme/common';
let win = null;
let stopAdvertise = null;
async function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        skipTaskbar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    });
    // Hidden agent window; no UI loaded for now
    const deviceId = uuidv4();
    stopAdvertise = startAdvertisement(deviceId, DEFAULT_AGENT_PORT);
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
app.on('before-quit', () => {
    if (stopAdvertise)
        stopAdvertise();
});
//# sourceMappingURL=main.js.map