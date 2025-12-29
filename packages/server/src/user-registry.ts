import type { UserInfo, MonitoringState } from '@monitor-me/shared';

/**
 * Connected client information
 */
interface ConnectedClient {
  socketId: string;
  role: 'user' | 'admin';
  userInfo?: UserInfo;
  adminName?: string;
}

/**
 * User Registry - Manages connected users and admins
 */
class UserRegistry {
  private clients: Map<string, ConnectedClient> = new Map();

  /**
   * Register a new user client
   */
  registerUser(socketId: string, name: string, machineId: string, state: MonitoringState): UserInfo {
    const userInfo: UserInfo = {
      id: socketId,
      name,
      machineId,
      state,
      isOnline: true,
      lastSeen: new Date().toISOString(),
    };

    this.clients.set(socketId, {
      socketId,
      role: 'user',
      userInfo,
    });

    console.log(`[Registry] User registered: ${name} (${machineId})`);
    return userInfo;
  }

  /**
   * Register a new admin client
   */
  registerAdmin(socketId: string, name: string): void {
    this.clients.set(socketId, {
      socketId,
      role: 'admin',
      adminName: name,
    });

    console.log(`[Registry] Admin registered: ${name}`);
  }

  /**
   * Remove a client (user or admin)
   */
  removeClient(socketId: string): ConnectedClient | undefined {
    const client = this.clients.get(socketId);
    if (client) {
      this.clients.delete(socketId);
      console.log(`[Registry] Client disconnected: ${socketId}`);
    }
    return client;
  }

  /**
   * Update a user's monitoring state
   */
  updateUserState(socketId: string, state: MonitoringState): UserInfo | undefined {
    const client = this.clients.get(socketId);
    if (client && client.role === 'user' && client.userInfo) {
      client.userInfo.state = state;
      client.userInfo.lastSeen = new Date().toISOString();
      console.log(`[Registry] User state updated: ${client.userInfo.name} -> ${state}`);
      return client.userInfo;
    }
    return undefined;
  }

  /**
   * Get all connected users (not admins)
   */
  getUsers(): UserInfo[] {
    const users: UserInfo[] = [];
    this.clients.forEach((client) => {
      if (client.role === 'user' && client.userInfo) {
        users.push(client.userInfo);
      }
    });
    return users;
  }

  /**
   * Get all admin socket IDs
   */
  getAdminSocketIds(): string[] {
    const adminIds: string[] = [];
    this.clients.forEach((client) => {
      if (client.role === 'admin') {
        adminIds.push(client.socketId);
      }
    });
    return adminIds;
  }

  /**
   * Get a specific user by socket ID
   */
  getUser(socketId: string): UserInfo | undefined {
    const client = this.clients.get(socketId);
    if (client && client.role === 'user') {
      return client.userInfo;
    }
    return undefined;
  }

  /**
   * Get client info by socket ID
   */
  getClient(socketId: string): ConnectedClient | undefined {
    return this.clients.get(socketId);
  }

  /**
   * Get admin name by socket ID
   */
  getAdminName(socketId: string): string | undefined {
    const client = this.clients.get(socketId);
    if (client && client.role === 'admin') {
      return client.adminName;
    }
    return undefined;
  }

  /**
   * Get count of connected clients
   */
  getStats(): { users: number; admins: number; total: number } {
    let users = 0;
    let admins = 0;
    this.clients.forEach((client) => {
      if (client.role === 'user') users++;
      else if (client.role === 'admin') admins++;
    });
    return { users, admins, total: users + admins };
  }
}

// Export singleton instance
export const userRegistry = new UserRegistry();
