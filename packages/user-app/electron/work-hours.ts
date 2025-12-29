import type { WorkHours } from '@monitor-me/shared';

/**
 * Check if current time is within configured work hours
 */
export function isWithinWorkHours(workHours: WorkHours): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const startTotalMinutes = workHours.startHour * 60 + workHours.startMinute;
  const endTotalMinutes = workHours.endHour * 60 + workHours.endMinute;

  // Check if current day is an active day
  if (!workHours.activeDays.includes(currentDay)) {
    return false;
  }

  // Check if current time is within work hours
  return currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
}

/**
 * Get milliseconds until next work hours start
 * Returns 0 if currently within work hours
 */
export function getMillisecondsUntilWorkHours(workHours: WorkHours): number {
  if (isWithinWorkHours(workHours)) {
    return 0;
  }

  const now = new Date();
  const currentDay = now.getDay();

  // Find next active day
  let daysUntilActive = 0;
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (workHours.activeDays.includes(checkDay)) {
      daysUntilActive = i;
      break;
    }
  }

  // Calculate target time
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntilActive);
  target.setHours(workHours.startHour, workHours.startMinute, 0, 0);

  // If target is in the past (same day but after end time), find next occurrence
  if (target <= now) {
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (workHours.activeDays.includes(checkDay)) {
        target.setDate(now.getDate() + i);
        target.setHours(workHours.startHour, workHours.startMinute, 0, 0);
        break;
      }
    }
  }

  return target.getTime() - now.getTime();
}
