import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'socket.io';
import { networkInterfaces } from 'os';
import * as fs from 'fs';
import { setupSocketHandlers } from './socket-handlers';
import {
  initScreenshotStorage,
  saveScreenshot,
  getScreenshots,
  getScreenshotPath,
  getStorageStats,
} from './screenshot-storage';
import { parseMultipartFormData } from './multipart-parser';
import { userRegistry } from './user-registry';
import { ServerEvents, type ScreenshotMetadata } from '@monitor-me/shared';

// Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Socket.io server reference (for notifying admins)
let io: Server;

/**
 * Get all local IP addresses
 */
function getLocalIPs(): string[] {
  const ips: string[] = [];
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    const netInterface = nets[name];
    if (netInterface) {
      for (const net of netInterface) {
        // Skip internal (loopback) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
  }

  return ips;
}

/**
 * Notify all admins of a new screenshot
 */
function notifyAdminsOfNewScreenshot(metadata: ScreenshotMetadata): void {
  const adminSocketIds = userRegistry.getAdminSocketIds();
  adminSocketIds.forEach((adminId) => {
    io.to(adminId).emit(ServerEvents.SCREENSHOT_AVAILABLE, metadata);
  });
}

/**
 * Parse URL parameters
 */
function parseUrlParams(url: string): URLSearchParams {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return new URLSearchParams();
  return new URLSearchParams(url.slice(queryStart + 1));
}

/**
 * Handle HTTP requests
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = req.url || '/';
  const pathname = url.split('?')[0];

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (pathname === '/health') {
    const stats = getStorageStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        screenshots: stats.totalScreenshots,
        users: stats.totalUsers,
      })
    );
    return;
  }

  // Screenshot upload endpoint
  if (pathname === '/api/screenshots/upload' && req.method === 'POST') {
    try {
      const formData = await parseMultipartFormData(req);
      const machineId = formData.machineId as string;
      const userName = formData.userName as string;
      const timestamp = formData.timestamp as string;
      const screenshot = formData.screenshot as Buffer;

      if (!machineId || !screenshot) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
        return;
      }

      const metadata = saveScreenshot(
        machineId,
        userName || 'Unknown',
        timestamp || new Date().toISOString(),
        screenshot
      );

      // Notify connected admins
      notifyAdminsOfNewScreenshot(metadata);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, screenshotId: metadata.id }));
    } catch (error) {
      console.error('[Server] Screenshot upload error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Upload failed' }));
    }
    return;
  }

  // Get screenshots list for a user
  if (pathname === '/api/screenshots' && req.method === 'GET') {
    const params = parseUrlParams(url);
    const machineId = params.get('machineId');
    const startDate = params.get('startDate') || undefined;
    const endDate = params.get('endDate') || undefined;
    const limit = parseInt(params.get('limit') || '50', 10);
    const offset = parseInt(params.get('offset') || '0', 10);

    if (!machineId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'machineId required' }));
      return;
    }

    const result = getScreenshots(machineId, startDate, endDate, limit, offset);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
    return;
  }

  // Serve screenshot image
  if (pathname.startsWith('/api/screenshots/image/') && req.method === 'GET') {
    const parts = pathname.split('/');
    const machineId = parts[4];
    const filename = parts[5];

    if (!machineId || !filename) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid path' }));
      return;
    }

    const filepath = getScreenshotPath(machineId, filename);
    if (!filepath) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Screenshot not found' }));
      return;
    }

    try {
      const imageBuffer = fs.readFileSync(filepath);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(imageBuffer);
    } catch (error) {
      console.error('[Server] Error serving screenshot:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to serve screenshot' }));
    }
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('MonitorMe Signaling Server');
}

/**
 * Start the signaling server
 */
function startServer(): void {
  // Initialize screenshot storage
  initScreenshotStorage();

  // Create HTTP server
  const httpServer = createServer((req, res) => {
    handleRequest(req, res).catch((error) => {
      console.error('[Server] Request error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
  });

  // Create Socket.io server
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for LAN usage
      methods: ['GET', 'POST'],
    },
  });

  // Set up socket handlers
  setupSocketHandlers(io);

  // Start listening
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('         MonitorMe Signaling Server Started');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log(`  Port: ${PORT}`);
    console.log('');
    console.log('  Connect using one of these addresses:');
    console.log('');
    console.log(`    Local:    http://localhost:${PORT}`);

    const localIPs = getLocalIPs();
    localIPs.forEach((ip) => {
      console.log(`    Network:  http://${ip}:${PORT}`);
    });

    console.log('');
    console.log('  API Endpoints:');
    console.log('');
    console.log('    POST /api/screenshots/upload    - Upload screenshot');
    console.log('    GET  /api/screenshots           - List screenshots');
    console.log('    GET  /api/screenshots/image/:id - Get screenshot image');
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('  Waiting for connections...');
    console.log('');
  });

  // Handle server errors
  httpServer.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Error: Port ${PORT} is already in use.`);
      console.error('Try using a different port: PORT=3001 npm start');
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    io.close();
    httpServer.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  });
}

// Start the server
startServer();
