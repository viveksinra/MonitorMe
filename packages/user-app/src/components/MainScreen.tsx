import { useState, useEffect } from 'react';
import { MonitoringState, StatusMessages, DAY_LABELS_SHORT } from '@monitor-me/shared';
import type { AppConfig } from '@monitor-me/shared';

interface MainScreenProps {
  onOpenSettings: () => void;
}

export default function MainScreen({ onOpenSettings }: MainScreenProps) {
  const [state, setState] = useState<MonitoringState>(MonitoringState.IDLE);
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = window.electronAPI.onStateChange(setState);
    return unsubscribe;
  }, []);

  const loadData = async () => {
    const [currentState, currentConfig] = await Promise.all([
      window.electronAPI.getState(),
      window.electronAPI.getConfig(),
    ]);
    setState(currentState);
    setConfig(currentConfig);
  };

  const handleMinimize = () => {
    window.electronAPI.minimizeToTray();
  };

  const getStateColor = () => {
    switch (state) {
      case MonitoringState.IDLE:
        return 'bg-green-500';
      case MonitoringState.SCREENSHOTS_ACTIVE:
        return 'bg-yellow-500';
      case MonitoringState.LIVE_VIEW_ACTIVE:
        return 'bg-red-500';
      case MonitoringState.PAUSED:
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStateBorderColor = () => {
    switch (state) {
      case MonitoringState.IDLE:
        return 'border-green-200 bg-green-50';
      case MonitoringState.SCREENSHOTS_ACTIVE:
        return 'border-yellow-200 bg-yellow-50';
      case MonitoringState.LIVE_VIEW_ACTIVE:
        return 'border-red-200 bg-red-50';
      case MonitoringState.PAUSED:
        return 'border-gray-200 bg-gray-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (hour: number, minute: number): string => {
    const h = hour.toString().padStart(2, '0');
    const m = minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MonitorMe</h1>
            <p className="text-gray-600">Screen Monitoring Active</p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Status Card */}
        <div className={`rounded-xl border-2 p-6 mb-6 ${getStateBorderColor()}`}>
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStateColor()} animate-pulse`}></div>
            <div>
              <h2 className="font-semibold text-gray-900">Current Status</h2>
              <p className="text-gray-600">{StatusMessages[state]}</p>
            </div>
          </div>
        </div>

        {/* Configuration Display */}
        {config && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Your Schedule</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Work Hours</span>
                <span className="font-medium">
                  {formatTime(config.workHours.startHour, config.workHours.startMinute)} -{' '}
                  {formatTime(config.workHours.endHour, config.workHours.endMinute)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Active Days</span>
                <span className="font-medium">
                  {config.workHours.activeDays.map((d) => DAY_LABELS_SHORT[d]).join(', ')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Screenshot Interval</span>
                <span className="font-medium">{config.screenshotIntervalMinutes} minutes</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Green: No active monitoring</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span>Yellow: Periodic screenshots running</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>Red: Admin viewing your screen</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
              <span>Gray: Monitoring paused</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleMinimize}
            className="flex-1 btn-secondary"
          >
            Minimize to Tray
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Right-click the tray icon to pause monitoring or quit the app
        </p>
      </div>
    </div>
  );
}
