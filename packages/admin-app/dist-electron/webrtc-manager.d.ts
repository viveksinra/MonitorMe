import type { Socket } from 'socket.io-client';
import { BrowserWindow } from 'electron';
interface AdminWebRTCManagerConfig {
    socket: Socket;
    userId: string;
    userName: string;
    mainWindow: BrowserWindow;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onError: (error: Error) => void;
}
export declare class AdminWebRTCManager {
    private peerConnection;
    private remoteStream;
    private socket;
    private userId;
    private userName;
    private mainWindow;
    private onConnectionStateChange;
    private onError;
    constructor(config: AdminWebRTCManagerConfig);
    initialize(): Promise<void>;
    handleOffer(offer: RTCSessionDescriptionInit): Promise<void>;
    handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void>;
    private setupPeerConnectionHandlers;
    getRemoteStream(): MediaStream | null;
    cleanup(): Promise<void>;
    isActive(): boolean;
}
export {};
//# sourceMappingURL=webrtc-manager.d.ts.map