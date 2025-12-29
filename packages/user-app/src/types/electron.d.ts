import type { ConsentData, AppConfig, MonitoringState, ServerConfig, ConnectionStatus } from '@monitor-me/shared';

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
