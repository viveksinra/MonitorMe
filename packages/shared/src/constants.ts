import type { WorkHours, AppConfig } from './types';

/**
 * Current consent form version
 */
export const CONSENT_VERSION = '1.0.0';

/**
 * Default work hours (9:00 AM - 6:00 PM, Monday-Friday)
 */
export const DEFAULT_WORK_HOURS: WorkHours = {
  startHour: 9,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
  activeDays: [1, 2, 3, 4, 5], // Monday through Friday
};

/**
 * Default screenshot interval in minutes
 */
export const DEFAULT_SCREENSHOT_INTERVAL = 15;

/**
 * Default application configuration
 */
export const DEFAULT_CONFIG: Omit<AppConfig, 'userName' | 'machineId'> = {
  workHours: DEFAULT_WORK_HOURS,
  screenshotIntervalMinutes: DEFAULT_SCREENSHOT_INTERVAL,
};

/**
 * App name constants
 */
export const APP_NAME = 'MonitorMe';
export const USER_APP_NAME = `${APP_NAME} - User`;
export const ADMIN_APP_NAME = `${APP_NAME} - Admin`;

/**
 * Window dimensions
 */
export const WINDOW_CONFIG = {
  USER_APP: {
    width: 480,
    height: 600,
    minWidth: 400,
    minHeight: 500,
  },
  ADMIN_APP: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  },
} as const;

/**
 * Days of week labels
 */
export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/**
 * Short day labels
 */
export const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
