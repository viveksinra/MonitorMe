import { useState, useEffect } from 'react';
import {
  DAY_LABELS,
  DEFAULT_WORK_HOURS,
  DEFAULT_SCREENSHOT_INTERVAL,
  DEFAULT_SERVER_CONFIG,
  ConnectionStatus,
} from '@monitor-me/shared';
import type { AppConfig, WorkHours, ServerConfig } from '@monitor-me/shared';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [_config, setConfig] = useState<AppConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Local form state
  const [startHour, setStartHour] = useState(DEFAULT_WORK_HOURS.startHour);
  const [startMinute, setStartMinute] = useState(DEFAULT_WORK_HOURS.startMinute);
  const [endHour, setEndHour] = useState(DEFAULT_WORK_HOURS.endHour);
  const [endMinute, setEndMinute] = useState(DEFAULT_WORK_HOURS.endMinute);
  const [activeDays, setActiveDays] = useState<number[]>(DEFAULT_WORK_HOURS.activeDays);
  const [screenshotInterval, setScreenshotInterval] = useState(DEFAULT_SCREENSHOT_INTERVAL);
  const [userName, setUserName] = useState('');

  // Server connection state
  const [serverHost, setServerHost] = useState(DEFAULT_SERVER_CONFIG.host);
  const [serverPort, setServerPort] = useState(DEFAULT_SERVER_CONFIG.port);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadConfig();
    loadServerConfig();
    loadConnectionStatus();

    // Subscribe to connection status changes
    const unsubscribe = window.electronAPI.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnecting(status === ConnectionStatus.CONNECTING);
    });

    return unsubscribe;
  }, []);

  const loadConfig = async () => {
    try {
      const loadedConfig = await window.electronAPI.getConfig();
      setConfig(loadedConfig);
      setStartHour(loadedConfig.workHours.startHour);
      setStartMinute(loadedConfig.workHours.startMinute);
      setEndHour(loadedConfig.workHours.endHour);
      setEndMinute(loadedConfig.workHours.endMinute);
      setActiveDays(loadedConfig.workHours.activeDays);
      setScreenshotInterval(loadedConfig.screenshotIntervalMinutes);
      setUserName(loadedConfig.userName || '');
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

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

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Save server config first
      const serverConfig: ServerConfig = { host: serverHost, port: serverPort };
      await window.electronAPI.setServerConfig(serverConfig);
      // Then connect
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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const workHours: WorkHours = {
        startHour,
        startMinute,
        endHour,
        endMinute,
        activeDays,
      };

      await window.electronAPI.setConfig({
        workHours,
        screenshotIntervalMinutes: screenshotInterval,
        userName,
      });

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (activeDays.includes(day)) {
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day].sort());
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>

        {/* User Name */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Your Name</h3>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            This will be displayed to the admin
          </p>
        </div>

        {/* Server Connection */}
        <div className="card p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Server Connection</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2">
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
          </div>

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
              {isConnecting ? 'Connecting...' : 'Connect to Server'}
            </button>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Enter the IP address shown when the server starts
          </p>
        </div>

        {/* Work Hours */}
        <div className="card p-6 mb-4">
          <h3 className="font-semibold text-gray-900 mb-4">Work Hours</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Time</label>
              <div className="flex gap-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="py-2">:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">End Time</label>
              <div className="flex gap-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="py-2">:</span>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {minutes.map((m) => (
                    <option key={m} value={m}>
                      {m.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <label className="block text-sm text-gray-600 mb-2">Active Days</label>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((day, index) => (
              <button
                key={day}
                onClick={() => toggleDay(index)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  activeDays.includes(index)
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Screenshot Interval */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Screenshot Interval</h3>
          <select
            value={screenshotInterval}
            onChange={(e) => setScreenshotInterval(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value={5}>Every 5 minutes</option>
            <option value={10}>Every 10 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every hour</option>
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Screenshots will only be taken during configured work hours
          </p>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full btn-primary"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>

        {saveMessage && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${
            saveMessage.includes('Error')
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}>
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}
