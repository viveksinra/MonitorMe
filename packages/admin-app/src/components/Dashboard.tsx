import { useState, useEffect } from 'react';
import {
  MonitoringState,
  ConnectionStatus,
  DEFAULT_SERVER_CONFIG,
} from '@monitor-me/shared';
import type { UserInfo, ServerConfig } from '@monitor-me/shared';
import ScreenshotTimeline from './ScreenshotTimeline';

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_CONFIG.host);
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_CONFIG.port);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedUserForScreenshots, setSelectedUserForScreenshots] = useState<UserInfo | null>(null);

  useEffect(() => {
    loadServerConfig();
    loadConnectionStatus();
    loadUsers();

    // Subscribe to connection status changes
    const unsubscribeStatus = window.electronAPI.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnecting(status === ConnectionStatus.CONNECTING);
    });

    // Subscribe to users updates
    const unsubscribeUsers = window.electronAPI.onUsersUpdate((updatedUsers) => {
      setUsers(updatedUsers);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeUsers();
    };
  }, []);

  const loadServerConfig = async () => {
    try {
      const config = await window.electronAPI.getServerConfig();
      setServerHost(config.host);
      setServerPort(config.port);
    } catch (error) {
      console.error('Error loading server config:', error);
    }
  };

  const loadConnectionStatus = async () => {
    try {
      const status = await window.electronAPI.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Error loading connection status:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const loadedUsers = await window.electronAPI.getUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const serverConfig: ServerConfig = { host: serverHost, port: serverPort };
      await window.electronAPI.setServerConfig(serverConfig);
      await window.electronAPI.connectToServer(serverConfig);
    } catch (error) {
      console.error('Error connecting to server:', error);
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await window.electronAPI.disconnectFromServer();
    } catch (error) {
      console.error('Error disconnecting from server:', error);
    }
  };

  const handleViewScreen = async (userId: string) => {
    try {
      await window.electronAPI.requestScreenView(userId);
    } catch (error) {
      console.error('Error requesting screen view:', error);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'bg-green-500';
      case ConnectionStatus.CONNECTING:
        return 'bg-yellow-500 animate-pulse';
      case ConnectionStatus.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getStateBadge = (state: MonitoringState) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (state) {
      case MonitoringState.IDLE:
        return `${baseClasses} bg-green-100 text-green-800`;
      case MonitoringState.SCREENSHOTS_ACTIVE:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case MonitoringState.LIVE_VIEW_ACTIVE:
        return `${baseClasses} bg-red-100 text-red-800`;
      case MonitoringState.PAUSED:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStateLabel = (state: MonitoringState) => {
    switch (state) {
      case MonitoringState.IDLE:
        return 'Idle';
      case MonitoringState.SCREENSHOTS_ACTIVE:
        return 'Screenshots Active';
      case MonitoringState.LIVE_VIEW_ACTIVE:
        return 'Live View';
      case MonitoringState.PAUSED:
        return 'Paused';
      default:
        return state;
    }
  };

  const onlineUsers = users.filter((u) => u.isOnline);
  const activeViewSessions = users.filter(
    (u) => u.state === MonitoringState.LIVE_VIEW_ACTIVE
  );
  const pausedUsers = users.filter((u) => u.state === MonitoringState.PAUSED);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MonitorMe Admin</h1>
                <p className="text-xs text-gray-500">Dashboard</p>
              </div>
            </div>

            <button onClick={onLogout} className="btn-secondary text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Server Connection Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Server Connection</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Server IP</label>
              <input
                type="text"
                value={serverHost}
                onChange={(e) => setServerHost(e.target.value)}
                placeholder="192.168.1.100"
                disabled={connectionStatus === ConnectionStatus.CONNECTED}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Port</label>
              <input
                type="number"
                value={serverPort}
                onChange={(e) => setServerPort(Number(e.target.value))}
                placeholder="3000"
                disabled={connectionStatus === ConnectionStatus.CONNECTED}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex items-end">
              {connectionStatus === ConnectionStatus.CONNECTED ? (
                <button
                  onClick={handleDisconnect}
                  className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || !serverHost}
                  className="w-full btn-primary disabled:opacity-50"
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-green-600">{onlineUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {activeViewSessions.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paused</p>
                <p className="text-2xl font-bold text-gray-600">{pausedUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Connected Users</h2>
            <p className="text-sm text-gray-600">
              Users connected to the monitoring network
            </p>
          </div>

          {connectionStatus !== ConnectionStatus.CONNECTED ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Not connected to server
              </h3>
              <p className="text-gray-600">
                Connect to a signaling server to see online users.
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users connected</h3>
              <p className="text-gray-600">
                Users will appear here once they install the MonitorMe User app and connect
                to the server.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Seen
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.machineId.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {user.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStateBadge(user.state)}>
                          {getStateLabel(user.state)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.lastSeen).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => setSelectedUserForScreenshots(user)}
                          className="btn-secondary text-xs"
                        >
                          Screenshots
                        </button>
                        <button
                          onClick={() => handleViewScreen(user.id)}
                          className="btn-primary text-xs"
                          disabled={!user.isOnline || user.state === MonitoringState.PAUSED}
                        >
                          View Screen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Screenshot Timeline Modal */}
      {selectedUserForScreenshots && (
        <ScreenshotTimeline
          machineId={selectedUserForScreenshots.machineId}
          userName={selectedUserForScreenshots.name}
          serverConfig={{ host: serverHost, port: serverPort }}
          onClose={() => setSelectedUserForScreenshots(null)}
        />
      )}
    </div>
  );
}
