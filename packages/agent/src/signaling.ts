import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, type WebSocket } from 'ws';
import { DEFAULT_AGENT_PORT } from './constants.js';

type StartOptions = {
  port?: number;
  psk?: string;
  sslKeyPath?: string;
  sslCertPath?: string;
};

export function startSignalingServer(options: StartOptions = {}) {
  const port = options.port ?? DEFAULT_AGENT_PORT;
  const psk = options.psk ?? process.env.MONITORME_PSK ?? 'dev-psk';

  const useTls = Boolean(options.sslKeyPath && options.sslCertPath);
  const server = useTls
    ? https.createServer({
        key: fs.readFileSync(path.resolve(options.sslKeyPath!)),
        cert: fs.readFileSync(path.resolve(options.sslCertPath!))
      })
    : http.createServer();

  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    let authed = false;
    const authTimeout = setTimeout(() => {
      if (!authed) ws.close(4001, 'auth timeout');
    }, 5000);

    ws.once('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg?.type === 'auth' && typeof msg.psk === 'string' && msg.psk === psk) {
          authed = true;
          clearTimeout(authTimeout);
          ws.send(JSON.stringify({ type: 'auth_ok' }));
        } else {
          ws.close(4003, 'auth failed');
        }
      } catch {
        ws.close(4002, 'invalid auth');
      }
    });

    ws.on('close', () => {
      clearTimeout(authTimeout);
    });
  });

  server.listen(port, '0.0.0.0');

  return () => {
    wss.close();
    server.close();
  };
}


