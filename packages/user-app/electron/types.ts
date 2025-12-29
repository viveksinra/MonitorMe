// Global state for tracking if app is quitting
// This is used to differentiate between close-to-tray and actual quit

let isAppQuitting = false;

export function setAppQuitting(value: boolean): void {
  isAppQuitting = value;
}

export function getAppQuitting(): boolean {
  return isAppQuitting;
}
