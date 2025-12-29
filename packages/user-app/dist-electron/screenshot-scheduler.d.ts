import { BrowserWindow } from 'electron';
import Store from 'electron-store';
/**
 * Initialize the screenshot scheduler with required references
 */
export declare function initScheduler(window: BrowserWindow, electronStore: Store, trayInstance: Electron.Tray | null): void;
/**
 * Update tray reference (in case it changes)
 */
export declare function updateSchedulerTray(trayInstance: Electron.Tray | null): void;
/**
 * Start the screenshot scheduler
 */
export declare function startScheduler(): void;
/**
 * Stop the screenshot scheduler
 */
export declare function stopScheduler(): void;
/**
 * Check if scheduler is running
 */
export declare function isSchedulerRunning(): boolean;
/**
 * Get the last capture time
 */
export declare function getLastCaptureTime(): string | null;
/**
 * Capture a screenshot immediately (manual trigger)
 */
export declare function captureNow(): Promise<void>;
//# sourceMappingURL=screenshot-scheduler.d.ts.map