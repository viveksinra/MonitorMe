"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
let peerConnection = null;
let localStream = null;
// Expose WebRTC control to the window
electron_1.contextBridge.exposeInMainWorld('webrtc', {
// This will be called by the main process via webContents.send
});
// Listen for start command from main process
electron_1.ipcRenderer.on('webrtc:start', async (_event, data) => {
    try {
        console.log('[WebRTC Renderer] Starting screen capture...');
        // Get screen stream using navigator (available in renderer)
        localStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: data.sourceId,
                    minWidth: 1280,
                    maxWidth: 1280,
                    minHeight: 720,
                    maxHeight: 720,
                    minFrameRate: 15,
                    maxFrameRate: 30,
                },
            },
        });
        console.log('[WebRTC Renderer] Stream captured, creating peer connection...');
        // Create peer connection
        peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        });
        // Add tracks to peer connection
        if (localStream) {
            localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, localStream);
            });
        }
        // Set up event handlers
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                electron_1.ipcRenderer.send('webrtc:ice-candidate', event.candidate.toJSON());
            }
        };
        peerConnection.onconnectionstatechange = () => {
            const state = peerConnection.connectionState;
            electron_1.ipcRenderer.send('webrtc:state-change', state);
            console.log(`[WebRTC Renderer] Connection state: ${state}`);
        };
        peerConnection.oniceconnectionstatechange = () => {
            console.log(`[WebRTC Renderer] ICE state: ${peerConnection.iceConnectionState}`);
        };
        // Create and send offer
        const offer = await peerConnection.createOffer({
            offerToReceiveVideo: false,
            offerToReceiveAudio: false,
        });
        await peerConnection.setLocalDescription(offer);
        // Send offer to main process
        electron_1.ipcRenderer.send('webrtc:offer', offer);
        console.log('[WebRTC Renderer] Offer created and sent');
    }
    catch (error) {
        console.error('[WebRTC Renderer] Error:', error);
        electron_1.ipcRenderer.send('webrtc:error', error.message);
    }
});
// Listen for answer from admin
electron_1.ipcRenderer.on('webrtc:answer', async (_event, answer) => {
    try {
        if (!peerConnection) {
            throw new Error('No peer connection exists');
        }
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[WebRTC Renderer] Answer received and set');
    }
    catch (error) {
        console.error('[WebRTC Renderer] Error setting answer:', error);
        electron_1.ipcRenderer.send('webrtc:error', error.message);
    }
});
// Listen for remote ICE candidates
electron_1.ipcRenderer.on('webrtc:remote-ice-candidate', async (_event, candidate) => {
    try {
        if (!peerConnection) {
            throw new Error('No peer connection exists');
        }
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    catch (error) {
        console.error('[WebRTC Renderer] Error adding ICE candidate:', error);
    }
});
// Listen for cleanup command
electron_1.ipcRenderer.on('webrtc:cleanup', () => {
    console.log('[WebRTC Renderer] Cleaning up...');
    // Stop all tracks
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
});
//# sourceMappingURL=webrtc-preload.js.map