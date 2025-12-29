import type { ConsentData, AppConfig, MonitoringState } from '@monitor-me/shared';

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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
