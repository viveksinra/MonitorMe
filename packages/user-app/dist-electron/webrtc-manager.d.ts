import type { Socket } from 'socket.io-client';
interface WebRTCManagerConfig {
    socket: Socket;
    adminId: string;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onError: (error: Error) => void;
}
export declare class UserWebRTCManager {
    private peerConnection;
    private localStream;
    private socket;
    private adminId;
    private onConnectionStateChange;
    private onError;
    constructor(config: WebRTCManagerConfig);
    startScreenShare(): Promise<void>;
    handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
    handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    private captureScreen;
    private setupPeerConnectionHandlers;
    cleanup(): Promise<void>;
    isActive(): boolean;
}
export {};
//# sourceMappingURL=webrtc-manager.d.ts.map