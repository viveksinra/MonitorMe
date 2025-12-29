import { useState, useEffect } from 'react';
import { DAY_LABELS, DEFAULT_WORK_HOURS, DEFAULT_SCREENSHOT_INTERVAL } from '@monitor-me/shared';
import type { AppConfig, WorkHours } from '@monitor-me/shared';

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

  useEffect(() => {
    loadConfig();
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
