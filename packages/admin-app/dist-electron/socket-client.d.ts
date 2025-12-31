import { BrowserWindow } from 'electron';
import { ConnectionStatus, type ServerConfig, type UserInfo, type AdminRegistrationData } from '@monitor-me/shared';
/**
 * Set the main window reference for IPC communication
 */
export declare function setMainWindow(window: BrowserWindow | null): void;
/**
 * Get current connection status
 */
export declare function getConnectionStatus(): ConnectionStatus;
/**
 * Get current users list
 */
export declare function getUsers(): UserInfo[];
/**
 * Consume buffered WebRTC signaling for a user (clears buffer)
 */
export declare function consumePendingWebRTC(userId: string): {
    offer?: RTCSessionDescriptionInit;
    ice: RTCIceCandidateInit[];
};
/**
 * Send WebRTC answer to the user via signaling server
 */
export declare function sendWebRTCAnswer(userId: string, answer: RTCSessionDescriptionInit): void;
/**
 * Send WebRTC ICE candidate to the user via signaling server
 */
export declare function sendWebRTCIceCandidate(userId: string, candidate: RTCIceCandidateInit): void;
/**
 * Connect to the signaling server as admin
 */
export declare function connectToServer(config: ServerConfig, adminData: AdminRegistrationData): void;
/**
 * Disconnect from the signaling server
 */
export declare function disconnectFromServer(): void;
/**
 * Request to view a user's screen
 */
export declare function requestViewUser(targetUserId: string): void;
/**
 * Cancel view request
 */
export declare function cancelViewRequest(targetUserId: string): void;
/**
 * Check if connected
 */
export declare function isConnected(): boolean;
/**
 * Admin ends the view session
 */
export declare function endViewSession(userId: string): void;
//# sourceMappingURL=socket-client.d.ts.map