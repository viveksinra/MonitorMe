import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels } from '@monitor-me/shared';
import type { ServerConfig, UserInfo, ConnectionStatus } from '@monitor-me/shared';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Server config
  getServerConfig: (): Promise<ServerConfig> =>
    ipcRenderer.invoke(IpcChannels.GET_SERVER_CONFIG),

  setServerConfig: (config: ServerConfig): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SET_SERVER_CONFIG, config),

  // Socket connection
  connectToServer: (config: ServerConfig): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_CONNECT, config),

  disconnectFromServer: (): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_DISCONNECT),

  getConnectionStatus: (): Promise<ConnectionStatus> =>
    ipcRenderer.invoke(IpcChannels.SOCKET_STATUS),

  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: ConnectionStatus) => callback(status);
    ipcRenderer.on(IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannels.SOCKET_ON_STATUS_CHANGE, handler);
    };
  },

  // Users
  getUsers: (): Promise<UserInfo[]> =>
    ipcRenderer.invoke(IpcChannels.GET_USERS),

  onUsersUpdate: (callback: (users: UserInfo[]) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, users: UserInfo[]) => callback(users);
    ipcRenderer.on(IpcChannels.ON_USERS_UPDATE, handler);
    return () => {
      ipcRenderer.removeListener(IpcChannels.ON_USERS_UPDATE, handler);
    };
  },

  // View requests
  requestScreenView: (userId: string): Promise<void> =>
    ipcRenderer.invoke(IpcChannels.REQUEST_VIEW, userId),

  // Live view event listeners
  onViewAccepted: (callback: (data: { userId: string; userName: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; userName: string }) => callback(data);
    ipcRenderer.on('view:accepted', handler);
    return () => {
      ipcRenderer.removeListener('view:accepted', handler);
    };
  },

  onViewRejected: (callback: (data: { userId: string; reason?: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; reason?: string }) => callback(data);
    ipcRenderer.on('view:rejected', handler);
    return () => {
      ipcRenderer.removeListener('view:rejected', handler);
    };
  },

  onViewEnded: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('view:ended', handler);
    return () => {
      ipcRenderer.removeListener('view:ended', handler);
    };
  },

  onStreamReady: (callback: (data: { userId: string; userName: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; userName: string }) => callback(data);
    ipcRenderer.on('webrtc:stream-ready', handler);
    return () => {
      ipcRenderer.removeListener('webrtc:stream-ready', handler);
    };
  },

  onWebRTCOffer: (callback: (data: { userId: string; offer: RTCSessionDescriptionInit }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; offer: RTCSessionDescriptionInit }) =>
      callback(data);
    ipcRenderer.on('webrtc:offer', handler);
    return () => {
      ipcRenderer.removeListener('webrtc:offer', handler);
    };
  },

  onWebRTCIceCandidate: (callback: (data: { userId: string; candidate: RTCIceCandidateInit }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; candidate: RTCIceCandidateInit }) =>
      callback(data);
    ipcRenderer.on('webrtc:ice-candidate', handler);
    return () => {
      ipcRenderer.removeListener('webrtc:ice-candidate', handler);
    };
  },

  consumePendingWebRTC: (userId: string): Promise<{ offer?: RTCSessionDescriptionInit; ice: RTCIceCandidateInit[] }> =>
    ipcRenderer.invoke('webrtc:consume-pending', userId),

  sendWebRTCAnswer: (userId: string, answer: RTCSessionDescriptionInit): Promise<void> =>
    ipcRenderer.invoke('webrtc:send-answer', { userId, answer }),

  sendWebRTCIceCandidate: (userId: string, candidate: RTCIceCandidateInit): Promise<void> =>
    ipcRenderer.invoke('webrtc:send-ice-candidate', { userId, candidate }),

  onWebRTCStateChange: (callback: (data: { userId: string; state: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; state: string }) => callback(data);
    ipcRenderer.on('webrtc:state-change', handler);
    return () => {
      ipcRenderer.removeListener('webrtc:state-change', handler);
    };
  },

  onWebRTCError: (callback: (data: { userId: string; error: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { userId: string; error: string }) => callback(data);
    ipcRenderer.on('webrtc:error', handler);
    return () => {
      ipcRenderer.removeListener('webrtc:error', handler);
    };
  },

  // Live view actions
  endViewSession: (userId: string): Promise<void> =>
    ipcRenderer.invoke('view:end-session', userId),

  getRemoteStream: (): Promise<MediaStream | null> =>
    ipcRenderer.invoke('view:get-stream'),
});
