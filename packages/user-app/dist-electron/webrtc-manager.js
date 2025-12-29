"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWebRTCManager = void 0;
const electron_1 = require("electron");
const shared_1 = require("@monitor-me/shared");
class UserWebRTCManager {
    peerConnection = null;
    localStream = null;
    socket;
    adminId;
    onConnectionStateChange;
    onError;
    constructor(config) {
        this.socket = config.socket;
        this.adminId = config.adminId;
        this.onConnectionStateChange = config.onConnectionStateChange;
        this.onError = config.onError;
    }
    async startScreenShare() {
        try {
            // Capture screen
            this.localStream = await this.captureScreen();
            // Create peer connection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }, // STUN server for NAT traversal
                ],
            });
            // Add tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.localStream);
            });
            // Set up event handlers
            this.setupPeerConnectionHandlers();
            // Create and send offer
            const offer = await this.peerConnection.createOffer({
                offerToReceiveVideo: false,
                offerToReceiveAudio: false,
            });
            await this.peerConnection.setLocalDescription(offer);
            // Send offer to admin via signaling server
            this.socket.emit(shared_1.ClientEvents.WEBRTC_OFFER, {
                targetId: this.adminId,
                offer: offer,
            });
            console.log('[WebRTC] Screen share started, offer sent');
        }
        catch (error) {
            this.onError(error);
            await this.cleanup();
        }
    }
    async handleAnswer(answer) {
        if (!this.peerConnection) {
            throw new Error('No peer connection exists');
        }
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('[WebRTC] Answer received and set');
    }
    async handleIceCandidate(candidate) {
        if (!this.peerConnection) {
            throw new Error('No peer connection exists');
        }
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
    async captureScreen() {
        const sources = await electron_1.desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: { width: 1, height: 1 }, // We don't need thumbnail
        });
        if (sources.length === 0) {
            throw new Error('No screen sources available');
        }
        const primarySource = sources[0];
        // Get screen stream using getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: primarySource.id,
                    minWidth: 1280,
                    maxWidth: 1280,
                    minHeight: 720,
                    maxHeight: 720,
                    minFrameRate: 15,
                    maxFrameRate: 30,
                },
            },
        });
        return stream;
    }
    setupPeerConnectionHandlers() {
        if (!this.peerConnection)
            return;
        // ICE candidate event
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit(shared_1.ClientEvents.WEBRTC_ICE_CANDIDATE, {
                    targetId: this.adminId,
                    candidate: event.candidate.toJSON(),
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
    async cleanup() {
        console.log('[WebRTC] Cleaning up...');
        // Stop all tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }
    isActive() {
        return this.peerConnection !== null &&
            this.peerConnection.connectionState === 'connected';
    }
}
exports.UserWebRTCManager = UserWebRTCManager;
//# sourceMappingURL=webrtc-manager.js.map