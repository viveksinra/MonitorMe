import type { ServerConfig, UserInfo, ConnectionStatus } from '@monitor-me/shared';

export interface ElectronAPI {
  // Server config
  getServerConfig: () => Promise<ServerConfig>;
  setServerConfig: (config: ServerConfig) => Promise<void>;

  // Socket connection
  connectToServer: (config: ServerConfig) => Promise<void>;
  disconnectFromServer: () => Promise<void>;
  getConnectionStatus: () => Promise<ConnectionStatus>;
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => () => void;

  // Users
  getUsers: () => Promise<UserInfo[]>;
  onUsersUpdate: (callback: (users: UserInfo[]) => void) => () => void;

  // View requests
  requestScreenView: (userId: string) => Promise<void>;

  // Live view event listeners
  onViewAccepted: (callback: (data: { userId: string; userName: string }) => void) => () => void;
  onViewRejected: (callback: (data: { userId: string; reason?: string }) => void) => () => void;
  onViewEnded: (callback: () => void) => () => void;
  onStreamReady: (callback: (data: { userId: string; userName: string }) => void) => () => void;
  onWebRTCOffer: (callback: (data: { userId: string; offer: RTCSessionDescriptionInit }) => void) => () => void;
  onWebRTCIceCandidate: (callback: (data: { userId: string; candidate: RTCIceCandidateInit }) => void) => () => void;
  onWebRTCStateChange: (callback: (data: { userId: string; state: string }) => void) => () => void;
  onWebRTCError: (callback: (data: { userId: string; error: string }) => void) => () => void;

  // Live view actions
  endViewSession: (userId: string) => Promise<void>;
  getRemoteStream: () => Promise<MediaStream | null>;

  // WebRTC signaling (renderer -> main -> socket)
  consumePendingWebRTC: (userId: string) => Promise<{ offer?: RTCSessionDescriptionInit; ice: RTCIceCandidateInit[] }>;
  sendWebRTCAnswer: (userId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
  sendWebRTCIceCandidate: (userId: string, candidate: RTCIceCandidateInit) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
