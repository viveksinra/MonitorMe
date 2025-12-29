import type { WorkHours } from '@monitor-me/shared';
/**
 * Check if current time is within configured work hours
 */
export declare function isWithinWorkHours(workHours: WorkHours): boolean;
/**
 * Get milliseconds until next work hours start
 * Returns 0 if currently within work hours
 */
export declare function getMillisecondsUntilWorkHours(workHours: WorkHours): number;
//# sourceMappingURL=work-hours.d.ts.map