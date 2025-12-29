import type { ConsentData, AppConfig, MonitoringState, ServerConfig, ConnectionStatus, ScreenshotCaptureEvent } from '@monitor-me/shared';

export interface ElectronAPI {
  // Consent
  getConsent: () => Promise<ConsentData | null>;
  setConsent: (consent: ConsentData) => Promise<void>;
  hasConsent: () => Promise<boolean>;

  // Config
  getConfig: () => Promise<AppConfig>;
  setConfig: (config: Partial<AppConfig>) => Promise<void>;

  // Monitoring state
  getState: () => Promise<MonitoringState>;
  setState: (state: MonitoringState) => Promise<void>;
  onStateChange: (callback: (state: MonitoringState) => void) => () => void;

  // Window controls
  minimizeToTray: () => void;
  quitApp: () => void;

  // Server config
  getServerConfig: () => Promise<ServerConfig>;
  setServerConfig: (config: ServerConfig) => Promise<void>;

  // Socket connection
  connectToServer: (config: ServerConfig) => Promise<void>;
  disconnectFromServer: () => Promise<void>;
  getConnectionStatus: () => Promise<ConnectionStatus>;
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => () => void;

  // Screenshot scheduler
  startScreenshotScheduler: () => Promise<void>;
  stopScreenshotScheduler: () => Promise<void>;
  getSchedulerStatus: () => Promise<boolean>;
  getLastScreenshotTime: () => Promise<string | null>;
  captureScreenshotNow: () => Promise<void>;
  onScreenshotCaptured: (callback: (event: ScreenshotCaptureEvent) => void) => () => void;

  // Live view requests
  onViewRequest: (callback: (data: { adminId: string; adminName: string }) => void) => () => void;
  onViewCancelled: (callback: () => void) => () => void;
  onViewConnected: (callback: () => void) => () => void;
  onViewEnded: (callback: () => void) => () => void;
  onViewError: (callback: (data: { message: string }) => void) => () => void;
  acceptViewRequest: () => Promise<void>;
  rejectViewRequest: (reason?: string) => Promise<void>;
  endViewSession: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
