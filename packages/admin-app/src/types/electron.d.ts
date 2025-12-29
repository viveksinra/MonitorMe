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
  onWebRTCStateChange: (callback: (data: { userId: string; state: string }) => void) => () => void;
  onWebRTCError: (callback: (data: { userId: string; error: string }) => void) => () => void;

  // Live view actions
  endViewSession: (userId: string) => Promise<void>;
  getRemoteStream: () => Promise<MediaStream | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
