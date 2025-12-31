import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to the window context for WebRTC communication
contextBridge.exposeInMainWorld('webrtcIpc', {
  sendOffer: (offer: RTCSessionDescriptionInit) => ipcRenderer.send('webrtc:offer', offer),
  sendIceCandidate: (candidate: RTCIceCandidateInit) => ipcRenderer.send('webrtc:ice-candidate', candidate),
  sendStateChange: (state: string) => ipcRenderer.send('webrtc:state-change', state),
  sendError: (error: string) => ipcRenderer.send('webrtc:error', error),
  onAnswer: (callback: (answer: RTCSessionDescriptionInit) => void) => {
    ipcRenderer.on('webrtc:answer', (_event, answer) => callback(answer));
  },
  onRemoteIceCandidate: (callback: (candidate: RTCIceCandidateInit) => void) => {
    ipcRenderer.on('webrtc:remote-ice-candidate', (_event, candidate) => callback(candidate));
  },
  onCleanup: (callback: () => void) => {
    ipcRenderer.on('webrtc:cleanup', callback);
  },
});
