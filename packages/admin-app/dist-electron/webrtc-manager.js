"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminWebRTCManager = void 0;
const shared_1 = require("@monitor-me/shared");
class AdminWebRTCManager {
    peerConnection = null;
    remoteStream = null;
    socket;
    userId;
    userName;
    mainWindow;
    onConnectionStateChange;
    onError;
    constructor(config) {
        this.socket = config.socket;
        this.userId = config.userId;
        this.userName = config.userName;
        this.mainWindow = config.mainWindow;
        this.onConnectionStateChange = config.onConnectionStateChange;
        this.onError = config.onError;
    }
    async initialize() {
        try {
            // Create peer connection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                ],
            });
            // Set up event handlers
            this.setupPeerConnectionHandlers();
            console.log('[WebRTC] Admin WebRTC initialized');
        }
        catch (error) {
            this.onError(error);
            await this.cleanup();
        }
    }
    async handleOffer(offer) {
        if (!this.peerConnection) {
            throw new Error('Peer connection not initialized');
        }
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        // Create answer
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        // Send answer to user via signaling server
        this.socket.emit(shared_1.ClientEvents.WEBRTC_ANSWER, {
            targetId: this.userId,
            answer: answer,
        });
        console.log('[WebRTC] Answer sent to user');
    }
    async handleIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error('No peer connection exists');
        }
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    setupPeerConnectionHandlers() {
        if (!this.peerConnection)
            return;
        // ICE candidate event
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit(shared_1.ClientEvents.WEBRTC_ICE_CANDIDATE, {
                    targetId: this.userId,
                    candidate: event.candidate.toJSON(),
                });
            }
        };
        // Track event - receive remote stream
        this.peerConnection.ontrack = (event) => {
            console.log('[WebRTC] Received remote track');
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                // Notify renderer that stream is ready
                this.mainWindow.webContents.send('webrtc:stream-ready', {
                    userId: this.userId,
                    userName: this.userName,
                });
            }
        };
        // Connection state change
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection.connectionState;
            console.log(`[WebRTC] Connection state: ${state}`);
            this.onConnectionStateChange(state);
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                this.cleanup();
            }
        };
        // ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            console.log(`[WebRTC] ICE state: ${this.peerConnection.iceConnectionState}`);
        };
    }
    getRemoteStream() {
        return this.remoteStream;
    }
    async cleanup() {
        console.log('[WebRTC] Cleaning up...');
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.remoteStream = null;
    }
    isActive() {
        return this.peerConnection !== null &&
            this.peerConnection.connectionState === 'connected';
    }
}
exports.AdminWebRTCManager = AdminWebRTCManager;
//# sourceMappingURL=webrtc-manager.js.map