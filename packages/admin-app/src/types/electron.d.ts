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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
