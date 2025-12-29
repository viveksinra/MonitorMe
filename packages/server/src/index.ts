import { createServer } from 'http';
import { Server } from 'socket.io';
import { networkInterfaces } from 'os';
import { setupSocketHandlers } from './socket-handlers';

// Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

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
 * Start the signaling server
 */
function startServer(): void {
  // Create HTTP server
  const httpServer = createServer((req, res) => {
    // Simple health check endpoint
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    // Default response
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('MonitorMe Signaling Server');
  });

  // Create Socket.io server
  const io = new Server(httpServer, {
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
