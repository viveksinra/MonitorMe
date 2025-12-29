/**
 * Represents the user's consent preferences
 */
export interface ConsentData {
  /** User has consented to periodic screenshots during work hours */
  screenshotConsent: boolean;
  /** User has consented to admin-initiated live screen viewing */
  liveViewConsent: boolean;
  /** User acknowledges monitoring indicators will be visible */
  visibilityAcknowledged: boolean;
  /** Timestamp when consent was given */
  consentTimestamp: string;
  /** Version of consent form (for future updates) */
  consentVersion: string;
}

/**
 * Work hours configuration
 */
export interface WorkHours {
  /** Start hour in 24h format (0-23) */
  startHour: number;
  /** Start minute (0-59) */
  startMinute: number;
  /** End hour in 24h format (0-23) */
  endHour: number;
  /** End minute (0-59) */
  endMinute: number;
  /** Days of week when monitoring is active (0=Sunday, 6=Saturday) */
  activeDays: number[];
}

/**
 * Application configuration
 */
export interface AppConfig {
  /** Work hours when monitoring is active */
  workHours: WorkHours;
  /** Screenshot capture interval in minutes */
  screenshotIntervalMinutes: number;
  /** User's display name */
  userName: string;
  /** Unique machine identifier */
  machineId: string;
}

/**
 * Current monitoring state
 */
export enum MonitoringState {
  /** No active monitoring */
  IDLE = 'idle',
  /** Periodic screenshots are being captured */
  SCREENSHOTS_ACTIVE = 'screenshots_active',
  /** Admin is viewing screen live */
  LIVE_VIEW_ACTIVE = 'live_view_active',
  /** User has paused monitoring */
  PAUSED = 'paused',
}

/**
 * Tray icon colors corresponding to monitoring states
 */
export const TrayIconColors = {
  [MonitoringState.IDLE]: 'green',
  [MonitoringState.SCREENSHOTS_ACTIVE]: 'yellow',
  [MonitoringState.LIVE_VIEW_ACTIVE]: 'red',
  [MonitoringState.PAUSED]: 'gray',
} as const;

/**
 * Status messages for each monitoring state
 */
export const StatusMessages = {
  [MonitoringState.IDLE]: 'Monitoring inactive',
  [MonitoringState.SCREENSHOTS_ACTIVE]: 'Periodic screenshots active',
  [MonitoringState.LIVE_VIEW_ACTIVE]: 'Admin is viewing your screen',
  [MonitoringState.PAUSED]: 'Monitoring paused',
} as const;

/**
 * User information for admin dashboard
 */
export interface UserInfo {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Machine identifier */
  machineId: string;
  /** Current monitoring state */
  state: MonitoringState;
  /** Whether user is currently online */
  isOnline: boolean;
  /** Last activity timestamp */
  lastSeen: string;
}

/**
 * Server configuration for socket connection
 */
export interface ServerConfig {
  /** Server host/IP address */
  host: string;
  /** Server port */
  port: number;
}

/**
 * Default server configuration
 */
export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  host: 'localhost',
  port: 3000,
};

/**
 * Connection status for socket clients
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * Client role for socket connections
 */
export enum ClientRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * User registration data sent to server
 */
export interface UserRegistrationData {
  /** User's display name */
  name: string;
  /** Unique machine identifier */
  machineId: string;
  /** Current monitoring state */
  state: MonitoringState;
}

/**
 * Admin registration data sent to server
 */
export interface AdminRegistrationData {
  /** Admin's display name */
  name: string;
}

/**
 * IPC channel names for Electron communication
 */
export const IpcChannels = {
  // Consent
  GET_CONSENT: 'consent:get',
  SET_CONSENT: 'consent:set',
  HAS_CONSENT: 'consent:has',

  // Config
  GET_CONFIG: 'config:get',
  SET_CONFIG: 'config:set',

  // Monitoring state
  GET_STATE: 'state:get',
  SET_STATE: 'state:set',
  ON_STATE_CHANGE: 'state:change',

  // Tray
  UPDATE_TRAY: 'tray:update',
  PAUSE_MONITORING: 'tray:pause',
  RESUME_MONITORING: 'tray:resume',

  // Window
  MINIMIZE_TO_TRAY: 'window:minimize-to-tray',
  SHOW_WINDOW: 'window:show',
  QUIT_APP: 'app:quit',

  // Socket connection
  SOCKET_CONNECT: 'socket:connect',
  SOCKET_DISCONNECT: 'socket:disconnect',
  SOCKET_STATUS: 'socket:status',
  SOCKET_ON_STATUS_CHANGE: 'socket:status-change',

  // Server config
  GET_SERVER_CONFIG: 'server:get-config',
  SET_SERVER_CONFIG: 'server:set-config',

  // Users (admin only)
  GET_USERS: 'users:get',
  ON_USERS_UPDATE: 'users:update',
  REQUEST_VIEW: 'users:request-view',
} as const;
