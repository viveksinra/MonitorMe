import type { Server, Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  type UserRegistrationData,
  type AdminRegistrationData,
  type MonitoringState,
} from '@monitor-me/shared';
import { userRegistry } from './user-registry';

// Active view sessions: userId -> adminId
const activeSessions = new Map<string, string>();

/**
 * Set up socket event handlers
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] New connection: ${socket.id}`);

    // Handle user registration
    socket.on(ClientEvents.USER_REGISTER, (data: UserRegistrationData) => {
      handleUserRegister(io, socket, data);
    });

    // Handle admin registration
    socket.on(ClientEvents.ADMIN_REGISTER, (data: AdminRegistrationData) => {
      handleAdminRegister(io, socket, data);
    });

    // Handle user state update
    socket.on(ClientEvents.USER_STATE_UPDATE, (data: { state: MonitoringState }) => {
      handleUserStateUpdate(io, socket, data);
    });

    // Handle admin view request
    socket.on(ClientEvents.ADMIN_REQUEST_VIEW, (data: { targetUserId: string }) => {
      handleAdminRequestView(io, socket, data);
    });

    // Handle admin cancel view
    socket.on(ClientEvents.ADMIN_CANCEL_VIEW, (data: { targetUserId: string }) => {
      handleAdminCancelView(io, socket, data);
    });

    // Handle user accept view
    socket.on(ClientEvents.USER_ACCEPT_VIEW, (data: { adminId: string }) => {
      handleUserAcceptView(io, socket, data);
    });

    // Handle user reject view
    socket.on(ClientEvents.USER_REJECT_VIEW, (data: { adminId: string; reason?: string }) => {
      handleUserRejectView(io, socket, data);
    });

    // Handle WebRTC offer
    socket.on(ClientEvents.WEBRTC_OFFER, (data: { targetId: string; offer: RTCSessionDescriptionInit }) => {
      handleWebRtcOffer(io, socket, data);
    });

    // Handle WebRTC answer
    socket.on(ClientEvents.WEBRTC_ANSWER, (data: { targetId: string; answer: RTCSessionDescriptionInit }) => {
      handleWebRtcAnswer(io, socket, data);
    });

    // Handle ICE candidate
    socket.on(ClientEvents.WEBRTC_ICE_CANDIDATE, (data: { targetId: string; candidate: RTCIceCandidateInit }) => {
      handleIceCandidate(io, socket, data);
    });

    // Handle user end view
    socket.on(ClientEvents.USER_END_VIEW, (data: { adminId: string }) => {
      handleUserEndView(io, socket, data);
    });

    // Handle admin end view
    socket.on(ClientEvents.ADMIN_END_VIEW, (data: { userId: string }) => {
      handleAdminEndView(io, socket, data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      handleDisconnect(io, socket);
    });
  });
}

/**
 * Handle user registration
 */
function handleUserRegister(io: Server, socket: Socket, data: UserRegistrationData): void {
  const { name, machineId, state } = data;

  // Register the user
  const userInfo = userRegistry.registerUser(socket.id, name, machineId, state);

  // Send confirmation to user
  socket.emit(ServerEvents.REGISTERED, { id: socket.id });

  // Send current user list to this user (for reference)
  socket.emit(ServerEvents.USERS_LIST, userRegistry.getUsers());

  // Notify all admins about the new user
  const adminSocketIds = userRegistry.getAdminSocketIds();
  adminSocketIds.forEach((adminId) => {
    io.to(adminId).emit(ServerEvents.USER_CONNECTED, userInfo);
    io.to(adminId).emit(ServerEvents.USERS_LIST, userRegistry.getUsers());
  });

  const stats = userRegistry.getStats();
  console.log(`[Socket] Users: ${stats.users}, Admins: ${stats.admins}`);
}

/**
 * Handle admin registration
 */
function handleAdminRegister(_io: Server, socket: Socket, data: AdminRegistrationData): void {
  const { name } = data;

  // Register the admin
  userRegistry.registerAdmin(socket.id, name);

  // Send confirmation
  socket.emit(ServerEvents.REGISTERED, { id: socket.id });

  // Send current user list to admin
  socket.emit(ServerEvents.USERS_LIST, userRegistry.getUsers());

  const stats = userRegistry.getStats();
  console.log(`[Socket] Users: ${stats.users}, Admins: ${stats.admins}`);
}

/**
 * Handle user state update
 */
function handleUserStateUpdate(
  io: Server,
  socket: Socket,
  data: { state: MonitoringState }
): void {
  const { state } = data;

  // Update user state in registry
  const userInfo = userRegistry.updateUserState(socket.id, state);

  if (userInfo) {
    // Notify all admins about the state change
    const adminSocketIds = userRegistry.getAdminSocketIds();
    adminSocketIds.forEach((adminId) => {
      io.to(adminId).emit(ServerEvents.USER_STATE_CHANGED, {
        userId: socket.id,
        state,
      });
    });
  }
}

/**
 * Handle admin view request
 */
function handleAdminRequestView(
  io: Server,
  socket: Socket,
  data: { targetUserId: string }
): void {
  const { targetUserId } = data;

  // Check if target user exists
  const targetUser = userRegistry.getUser(targetUserId);
  if (!targetUser) {
    socket.emit(ServerEvents.ERROR, { message: 'User not found' });
    return;
  }

  // Check if user is already in a session
  if (activeSessions.has(targetUserId)) {
    socket.emit(ServerEvents.ERROR, { message: 'User is already in a viewing session' });
    return;
  }

  // Get admin name
  const adminName = userRegistry.getAdminName(socket.id) || 'Admin';

  // Send view request to target user
  io.to(targetUserId).emit(ServerEvents.VIEW_REQUEST, {
    adminId: socket.id,
    adminName,
  });

  console.log(`[Socket] Admin ${adminName} requested to view ${targetUser.name}`);
}

/**
 * Handle admin cancel view
 */
function handleAdminCancelView(
  io: Server,
  socket: Socket,
  data: { targetUserId: string }
): void {
  const { targetUserId } = data;

  // Send cancel notification to target user
  io.to(targetUserId).emit(ServerEvents.VIEW_CANCELLED, {
    adminId: socket.id,
  });

  console.log(`[Socket] Admin cancelled view request for ${targetUserId}`);
}

/**
 * Handle user accept view
 */
function handleUserAcceptView(io: Server, socket: Socket, data: { adminId: string }): void {
  const userInfo = userRegistry.getUser(socket.id);

  // Register the session
  activeSessions.set(socket.id, data.adminId);

  io.to(data.adminId).emit(ServerEvents.VIEW_ACCEPTED, {
    userId: socket.id,
    userName: userInfo?.name || 'Unknown',
  });

  console.log(`[Socket] User ${socket.id} accepted view from ${data.adminId}`);
}

/**
 * Handle user reject view
 */
function handleUserRejectView(io: Server, socket: Socket, data: { adminId: string; reason?: string }): void {
  io.to(data.adminId).emit(ServerEvents.VIEW_REJECTED, {
    userId: socket.id,
    reason: data.reason,
  });

  console.log(`[Socket] User ${socket.id} rejected view from ${data.adminId}`);
}

/**
 * Handle WebRTC offer
 */
function handleWebRtcOffer(io: Server, socket: Socket, data: { targetId: string; offer: RTCSessionDescriptionInit }): void {
  io.to(data.targetId).emit(ServerEvents.WEBRTC_OFFER_RECEIVED, {
    fromId: socket.id,
    offer: data.offer,
  });

  console.log(`[Socket] Relaying WebRTC offer from ${socket.id} to ${data.targetId}`);
}

/**
 * Handle WebRTC answer
 */
function handleWebRtcAnswer(io: Server, socket: Socket, data: { targetId: string; answer: RTCSessionDescriptionInit }): void {
  io.to(data.targetId).emit(ServerEvents.WEBRTC_ANSWER_RECEIVED, {
    fromId: socket.id,
    answer: data.answer,
  });

  console.log(`[Socket] Relaying WebRTC answer from ${socket.id} to ${data.targetId}`);
}

/**
 * Handle ICE candidate
 */
function handleIceCandidate(io: Server, socket: Socket, data: { targetId: string; candidate: RTCIceCandidateInit }): void {
  io.to(data.targetId).emit(ServerEvents.WEBRTC_ICE_CANDIDATE_RECEIVED, {
    fromId: socket.id,
    candidate: data.candidate,
  });

  // Don't log every ICE candidate to avoid spam
}

/**
 * Handle user end view
 */
function handleUserEndView(io: Server, socket: Socket, data: { adminId: string }): void {
  // Remove session
  activeSessions.delete(socket.id);

  io.to(data.adminId).emit(ServerEvents.VIEW_ENDED, {
    endedBy: 'user',
    userId: socket.id,
  });

  console.log(`[Socket] User ${socket.id} ended view session with ${data.adminId}`);
}

/**
 * Handle admin end view
 */
function handleAdminEndView(io: Server, socket: Socket, data: { userId: string }): void {
  // Remove session
  activeSessions.delete(data.userId);

  io.to(data.userId).emit(ServerEvents.VIEW_ENDED, {
    endedBy: 'admin',
    adminId: socket.id,
  });

  console.log(`[Socket] Admin ${socket.id} ended view session with ${data.userId}`);
}

/**
 * Handle client disconnection
 */
function handleDisconnect(io: Server, socket: Socket): void {
  const client = userRegistry.removeClient(socket.id);

  if (client) {
    // Check if this client was in an active view session
    if (client.role === 'user') {
      const adminId = activeSessions.get(socket.id);
      if (adminId) {
        // Notify admin that user disconnected during session
        io.to(adminId).emit(ServerEvents.VIEW_ENDED, {
          endedBy: 'user',
          userId: socket.id,
        });
        activeSessions.delete(socket.id);
      }
    } else if (client.role === 'admin') {
      // Find and notify any user this admin was viewing
      for (const [userId, adminId] of activeSessions.entries()) {
        if (adminId === socket.id) {
          io.to(userId).emit(ServerEvents.VIEW_ENDED, {
            endedBy: 'admin',
            adminId: socket.id,
          });
          activeSessions.delete(userId);
        }
      }
    }

    if (client.role === 'user' && client.userInfo) {
      // Notify all admins that user disconnected
      const adminSocketIds = userRegistry.getAdminSocketIds();
      adminSocketIds.forEach((adminId) => {
        io.to(adminId).emit(ServerEvents.USER_DISCONNECTED, {
          userId: socket.id,
        });
        io.to(adminId).emit(ServerEvents.USERS_LIST, userRegistry.getUsers());
      });
    }

    const stats = userRegistry.getStats();
    console.log(`[Socket] Users: ${stats.users}, Admins: ${stats.admins}`);
  }
}
