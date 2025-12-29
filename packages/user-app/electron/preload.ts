import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '@monitor-me/shared';
import type { ConsentData, AppConfig, MonitoringState, ServerConfig, ConnectionStatus, ScreenshotCaptureEvent } from '@monitor-me/shared';

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

  // Server config
  getServerConfig: (): Promise<ServerConfig> =>
    ipcRenderer.invoke(IpcChannels.GET_SERVER_CONFIG),

  setServerConfig: (config: ServerConfig): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_SERVER_CONFIG, config),

  // Socket connection
  connectToServer: (config: ServerConfig): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_CONNECT, config),

  disconnectFromServer: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_DISCONNECT),

  getConnectionStatus: (): Promise<ConnectionStatus> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_STATUS),

  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: ConnectionStatus) => callback(status);
    ipcRenderer.on(IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
    };
  },

  // Screenshot scheduler
  startScreenshotScheduler: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.START_SCREENSHOT_SCHEDULER),

  stopScreenshotScheduler: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.STOP_SCREENSHOT_SCHEDULER),

  getSchedulerStatus: (): Promise<boolean> =>
    ipcRenderer.invoke(IpcChannels.GET_SCHEDULER_STATUS),

  getLastScreenshotTime: (): Promise<string | null> =>
    ipcRenderer.invoke(IpcChannels.GET_LAST_SCREENSHOT_TIME),

  captureScreenshotNow: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.CAPTURE_SCREENSHOT_NOW),

  onScreenshotCaptured: (callback: (event: ScreenshotCaptureEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: ScreenshotCaptureEvent) => callback(data);
    ipcRenderer.on(IpcChannels.ON_SCREENSHOT_CAPTURED, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannels.ON_SCREENSHOT_CAPTURED, handler);
    };
  },

  // View request handlers
  onViewRequest: (callback: (data: { adminId: string; adminName: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { adminId: string; adminName: string }) => callback(data);
    ipcRenderer.on('view:request', handler);
    return () => {
      ipcRenderer.removeListener('view:request', handler);
    };
  },

  onViewCancelled: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('view:cancelled', handler);
    return () => {
      ipcRenderer.removeListener('view:cancelled', handler);
    };
  },

  onViewConnected: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('view:connected', handler);
    return () => {
      ipcRenderer.removeListener('view:connected', handler);
    };
  },

  onViewEnded: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('view:ended', handler);
    return () => {
      ipcRenderer.removeListener('view:ended', handler);
    };
  },

  onViewError: (callback: (data: { message: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { message: string }) => callback(data);
    ipcRenderer.on('view:error', handler);
    return () => {
      ipcRenderer.removeListener('view:error', handler);
    };
  },

  acceptViewRequest: (): Promise<void> =>
    ipcRenderer.invoke('view:accept'),

  rejectViewRequest: (reason?: string): Promise<void> =>
    ipcRenderer.invoke('view:reject', reason),

  endViewSession: (): Promise<void> =>
    ipcRenderer.invoke('view:end'),
});
