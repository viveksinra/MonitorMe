// Types
export type {
  ConsentData,
  WorkHours,
  AppConfig,
  UserInfo,
  ServerConfig,
  UserRegistrationData,
  AdminRegistrationData,
} from './types';

export {
  MonitoringState,
  TrayIconColors,
  StatusMessages,
  IpcChannels,
  DEFAULT_SERVER_CONFIG,
  ConnectionStatus,
  ClientRole,
} from './types';

// Socket Events
export type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketEvents,
} from './events';

export {
  ClientEvents,
  ServerEvents,
} from './events';

// Constants
export {
  CONSENT_VERSION,
  DEFAULT_WORK_HOURS,
  DEFAULT_SCREENSHOT_INTERVAL,
  DEFAULT_CONFIG,
  APP_NAME,
  USER_APP_NAME,
  ADMIN_APP_NAME,
  WINDOW_CONFIG,
  DAY_LABELS,
  DAY_LABELS_SHORT,
} from './constants';
