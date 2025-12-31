import type { Socket } from 'socket.io-client';
interface WebRTCManagerConfig {
    socket: Socket;
    adminId: string;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onError: (error: Error) => void;
}
export declare class UserWebRTCManager {
    private socket;
    private adminId;
    private onConnectionStateChange;
    private onError;
    private webrtcWindow;
    private static localPageUrl;
    private static localPageServerStarting;
    constructor(config: WebRTCManagerConfig);
    private static ensureLocalWebRTCPageUrl;
    startScreenShare(): Promise<void>;
    private injectWebRTCCode;
    private setupWebRTCHandlers;
    handleAnswer(answer: RTCSessionDescriptionInit): Promise<void>;
    handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    cleanup(): Promise<void>;
    isActive(): boolean;
}
export {};
//# sourceMappingURL=webrtc-manager.d.ts.map