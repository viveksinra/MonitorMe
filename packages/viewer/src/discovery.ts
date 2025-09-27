import Bonjour from 'bonjour-service';
import { SERVICE_PROTOCOL, SERVICE_TYPE } from '@monitorme/common';

export type DiscoveredAgent = {
  host: string;
  port: number;
  deviceId?: string;
};

export function discoverAgents(onUpdate: (agents: DiscoveredAgent[]) => void) {
  const bonjour = new Bonjour();
  const browser = bonjour.find({ type: SERVICE_TYPE, protocol: SERVICE_PROTOCOL as any });
  const agents = new Map<string, DiscoveredAgent>();

  const push = () => onUpdate(Array.from(agents.values()));

  browser.on('up', (s) => {
    const host = s.host || s.fqdn || 'unknown';
    const port = s.port || 0;
    const deviceId = s.txt?.deviceId as string | undefined;
    agents.set(`${host}:${port}`, { host, port, deviceId });
    push();
  });
  browser.on('down', (s) => {
    const host = s.host || s.fqdn || 'unknown';
    const port = s.port || 0;
    agents.delete(`${host}:${port}`);
    push();
  });

  browser.start();
  return () => {
    browser.stop();
  };
}


