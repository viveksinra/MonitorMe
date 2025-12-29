import type { MonitoringState, UserInfo, UserRegistrationData, AdminRegistrationData } from './types';

/**
 * Socket event names for client -> server communication
 */
export const ClientEvents = {
  /** User app registers with server */
  USER_REGISTER: 'user:register',
  /** Admin app registers with server */
  ADMIN_REGISTER: 'admin:register',
  /** User sends state change */
  USER_STATE_UPDATE: 'user:state-update',
  /** Admin requests to view user screen */
  ADMIN_REQUEST_VIEW: 'admin:request-view',
  /** Admin cancels view request */
  ADMIN_CANCEL_VIEW: 'admin:cancel-view',
} as const;

/**
 * Socket event names for server -> client communication
 */
export const ServerEvents = {
  /** Server sends full user list */
  USERS_LIST: 'users:list',
  /** New user came online */
  USER_CONNECTED: 'user:connected',
  /** User went offline */
  USER_DISCONNECTED: 'user:disconnected',
  /** User state updated */
  USER_STATE_CHANGED: 'user:state-changed',
  /** Admin wants to view (sent to user) */
  VIEW_REQUEST: 'view:request',
  /** View request cancelled */
  VIEW_CANCELLED: 'view:cancelled',
  /** Registration successful */
  REGISTERED: 'registered',
  /** Error occurred */
  ERROR: 'error',
} as const;

/**
 * Payload types for client -> server events
 */
export interface ClientToServerEvents {
  [ClientEvents.USER_REGISTER]: (data: UserRegistrationData) => void;
  [ClientEvents.ADMIN_REGISTER]: (data: AdminRegistrationData) => void;
  [ClientEvents.USER_STATE_UPDATE]: (data: { state: MonitoringState }) => void;
  [ClientEvents.ADMIN_REQUEST_VIEW]: (data: { targetUserId: string }) => void;
  [ClientEvents.ADMIN_CANCEL_VIEW]: (data: { targetUserId: string }) => void;
}

/**
 * Payload types for server -> client events
 */
export interface ServerToClientEvents {
  [ServerEvents.USERS_LIST]: (users: UserInfo[]) => void;
  [ServerEvents.USER_CONNECTED]: (user: UserInfo) => void;
  [ServerEvents.USER_DISCONNECTED]: (data: { userId: string }) => void;
  [ServerEvents.USER_STATE_CHANGED]: (data: { userId: string; state: MonitoringState }) => void;
  [ServerEvents.VIEW_REQUEST]: (data: { adminId: string; adminName: string }) => void;
  [ServerEvents.VIEW_CANCELLED]: (data: { adminId: string }) => void;
  [ServerEvents.REGISTERED]: (data: { id: string }) => void;
  [ServerEvents.ERROR]: (data: { message: string }) => void;
}

/**
 * Combined event types for type-safe Socket.io usage
 */
export type SocketEvents = ClientToServerEvents & ServerToClientEvents;
