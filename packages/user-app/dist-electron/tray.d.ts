import { Tray } from 'electron';
import { MonitoringState } from '@monitor-me/shared';
/**
 * Create the system tray icon
 */
export declare function createTray(showWindow: () => void): Tray;
/**
 * Update the tray icon and menu for a new state
 */
export declare function updateTrayState(tray: Tray | null, state: MonitoringState): void;
/**
 * Destroy the tray icon
 */
export declare function destroyTray(tray: Tray | null): void;
//# sourceMappingURL=tray.d.ts.map