import type { MonitoringState, UserInfo, UserRegistrationData, AdminRegistrationData, ScreenshotMetadata } from './types';

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
  /** User accepts view request */
  USER_ACCEPT_VIEW: 'user:accept-view',
  /** User rejects view request */
  USER_REJECT_VIEW: 'user:reject-view',
  /** WebRTC offer from user */
  WEBRTC_OFFER: 'webrtc:offer',
  /** WebRTC answer from admin */
  WEBRTC_ANSWER: 'webrtc:answer',
  /** WebRTC ICE candidate exchange */
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',
  /** User ends view session */
  USER_END_VIEW: 'user:end-view',
  /** Admin ends view session */
  ADMIN_END_VIEW: 'admin:end-view',
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
  /** User accepted view request (sent to admin) */
  VIEW_ACCEPTED: 'view:accepted',
  /** User rejected view request (sent to admin) */
  VIEW_REJECTED: 'view:rejected',
  /** WebRTC offer relayed to admin */
  WEBRTC_OFFER_RECEIVED: 'webrtc:offer-received',
  /** WebRTC answer relayed to user */
  WEBRTC_ANSWER_RECEIVED: 'webrtc:answer-received',
  /** WebRTC ICE candidate relayed */
  WEBRTC_ICE_CANDIDATE_RECEIVED: 'webrtc:ice-candidate-received',
  /** View session ended */
  VIEW_ENDED: 'view:ended',
  /** Registration successful */
  REGISTERED: 'registered',
  /** Error occurred */
  ERROR: 'error',
  /** New screenshot available (sent to admins) */
  SCREENSHOT_AVAILABLE: 'screenshot:available',
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
  [ClientEvents.USER_ACCEPT_VIEW]: (data: { adminId: string }) => void;
  [ClientEvents.USER_REJECT_VIEW]: (data: { adminId: string; reason?: string }) => void;
  [ClientEvents.WEBRTC_OFFER]: (data: { targetId: string; offer: RTCSessionDescriptionInit }) => void;
  [ClientEvents.WEBRTC_ANSWER]: (data: { targetId: string; answer: RTCSessionDescriptionInit }) => void;
  [ClientEvents.WEBRTC_ICE_CANDIDATE]: (data: { targetId: string; candidate: RTCIceCandidateInit }) => void;
  [ClientEvents.USER_END_VIEW]: (data: { adminId: string }) => void;
  [ClientEvents.ADMIN_END_VIEW]: (data: { userId: string }) => void;
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
  [ServerEvents.VIEW_ACCEPTED]: (data: { userId: string; userName: string }) => void;
  [ServerEvents.VIEW_REJECTED]: (data: { userId: string; reason?: string }) => void;
  [ServerEvents.WEBRTC_OFFER_RECEIVED]: (data: { fromId: string; offer: RTCSessionDescriptionInit }) => void;
  [ServerEvents.WEBRTC_ANSWER_RECEIVED]: (data: { fromId: string; answer: RTCSessionDescriptionInit }) => void;
  [ServerEvents.WEBRTC_ICE_CANDIDATE_RECEIVED]: (data: { fromId: string; candidate: RTCIceCandidateInit }) => void;
  [ServerEvents.VIEW_ENDED]: (data: { endedBy: 'user' | 'admin'; userId?: string; adminId?: string }) => void;
  [ServerEvents.REGISTERED]: (data: { id: string }) => void;
  [ServerEvents.ERROR]: (data: { message: string }) => void;
  [ServerEvents.SCREENSHOT_AVAILABLE]: (data: ScreenshotMetadata) => void;
}

/**
 * Combined event types for type-safe Socket.io usage
 */
export type SocketEvents = ClientToServerEvents & ServerToClientEvents;
