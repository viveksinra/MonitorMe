import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '@monitor-me/shared';
import type { ConsentData, AppConfig, MonitoringState } from '@monitor-me/shared';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Consent
  getConsent: (): Promise<ConsentData | null> =>
    ipcRenderer.invoke(IpcChannels.GET_CONSENT),

  setConsent: (consent: ConsentData): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_CONSENT, consent),

  hasConsent: (): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.HAS_CONSENT),

  // Config
  getConfig: (): Promise<AppConfig> =>
    ipcRenderer.invoke(IpcChannels.GET_CONFIG),

  setConfig: (config: Partial<AppConfig>): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_CONFIG, config),

  // Monitoring state
  getState: (): Promise<MonitoringState> =>
    ipcRenderer.invoke(IpcChannels.GET_STATE),

  setState: (state: MonitoringState): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_STATE, state),

  onStateChange: (callback: (state: MonitoringState) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: MonitoringState) => callback(state);
    ipcRenderer.on(IpcChannels.ON_STATE_CHANGE, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannels.ON_STATE_CHANGE, handler);
    };
  },

  // Window controls
  minimizeToTray: (): void =>
    ipcRenderer.send(IpcChannels.MINIMIZE_TO_TRAY),

  quitApp: (): void =>
    ipcRenderer.send(IpcChannels.QUIT_APP),
});
