import * as fs from 'fs';
import * as path from 'path';
import type { ScreenshotMetadata } from '@monitor-me/shared';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');

// In-memory metadata cache (in production, use a database)
const screenshotMetadata: Map<string, ScreenshotMetadata[]> = new Map();

/**
 * Initialize screenshot storage directory
 */
export function initScreenshotStorage(): void {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }
  console.log(`[Storage] Screenshot directory: ${SCREENSHOTS_DIR}`);
}

/**
 * Get user's screenshot directory, creating if needed
 */
function getUserDir(machineId: string): string {
  // Sanitize machineId to prevent directory traversal
  const sanitizedId = machineId.replace(/[^a-zA-Z0-9-]/g, '');
  const userDir = path.join(SCREENSHOTS_DIR, sanitizedId);
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  return userDir;
}

/**
 * Save screenshot and metadata
 */
export function saveScreenshot(
  machineId: string,
  userName: string,
  timestamp: string,
  imageBuffer: Buffer
): ScreenshotMetadata {
  const userDir = getUserDir(machineId);
  const screenshotId = `${machineId}-${Date.now()}`;
  const filename = `${screenshotId}.png`;
  const filepath = path.join(userDir, filename);

  // Write file
  fs.writeFileSync(filepath, imageBuffer);

  // Get file size
  const fileSize = imageBuffer.length;

  // Create metadata
  const metadata: ScreenshotMetadata = {
    id: screenshotId,
    machineId,
    userName,
    timestamp,
    filename,
    fileSize,
  };

  // Store metadata in memory
  if (!screenshotMetadata.has(machineId)) {
    screenshotMetadata.set(machineId, []);
  }
  screenshotMetadata.get(machineId)!.push(metadata);

  console.log(`[Storage] Saved screenshot: ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);
  return metadata;
}

/**
 * Get screenshots for a user
 */
export function getScreenshots(
  machineId: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50,
  offset: number = 0
): { screenshots: ScreenshotMetadata[]; total: number; hasMore: boolean } {
  let screenshots = screenshotMetadata.get(machineId) || [];

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate).getTime();
    screenshots = screenshots.filter((s) => new Date(s.timestamp).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    screenshots = screenshots.filter((s) => new Date(s.timestamp).getTime() <= end);
  }

  // Sort by timestamp descending (newest first)
  screenshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = screenshots.length;
  const paginated = screenshots.slice(offset, offset + limit);

  return {
    screenshots: paginated,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Get screenshot file path
 */
export function getScreenshotPath(machineId: string, filename: string): string | null {
  // Sanitize inputs to prevent directory traversal
  const sanitizedMachineId = machineId.replace(/[^a-zA-Z0-9-]/g, '');
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '');

  const filepath = path.join(SCREENSHOTS_DIR, sanitizedMachineId, sanitizedFilename);

  // Ensure the resolved path is within SCREENSHOTS_DIR
  const resolvedPath = path.resolve(filepath);
  if (!resolvedPath.startsWith(path.resolve(SCREENSHOTS_DIR))) {
    console.error(`[Storage] Path traversal attempt blocked: ${filepath}`);
    return null;
  }

  if (fs.existsSync(filepath)) {
    return filepath;
  }
  return null;
}

/**
 * Delete old screenshots (cleanup utility)
 */
export function cleanupOldScreenshots(maxAgeDays: number = 30): number {
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - maxAge;
  let deletedCount = 0;

  screenshotMetadata.forEach((screenshots, machineId) => {
    const toKeep: ScreenshotMetadata[] = [];

    screenshots.forEach((screenshot) => {
      if (new Date(screenshot.timestamp).getTime() < cutoff) {
        const filepath = path.join(SCREENSHOTS_DIR, machineId, screenshot.filename);
        try {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
            deletedCount++;
          }
        } catch (error) {
          console.error(`[Storage] Failed to delete: ${filepath}`, error);
        }
      } else {
        toKeep.push(screenshot);
      }
    });

    screenshotMetadata.set(machineId, toKeep);
  });

  if (deletedCount > 0) {
    console.log(`[Storage] Cleaned up ${deletedCount} old screenshots`);
  }

  return deletedCount;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): { totalScreenshots: number; totalUsers: number } {
  let totalScreenshots = 0;
  screenshotMetadata.forEach((screenshots) => {
    totalScreenshots += screenshots.length;
  });

  return {
    totalScreenshots,
    totalUsers: screenshotMetadata.size,
  };
}
