export const SERVICE_TYPE = 'monitorme';
export const SERVICE_PROTOCOL = 'tcp';
export const DEFAULT_AGENT_PORT = 47827;

export type ScreenshotMeta = {
  deviceId: string;
  timestamp: number; // epoch ms
  contentType: 'image/png' | 'image/jpeg';
};


