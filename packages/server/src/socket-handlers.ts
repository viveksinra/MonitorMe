import type { Server, Socket } from 'socket.io';
import {
  ClientEvents,
  ServerEvents,
  type UserRegistrationData,
  type AdminRegistrationData,
  type MonitoringState,
} from '@monitor-me/shared';
import { userRegistry } from './user-registry';

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
 * Handle client disconnection
 */
function handleDisconnect(io: Server, socket: Socket): void {
  const client = userRegistry.removeClient(socket.id);

  if (client) {
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
