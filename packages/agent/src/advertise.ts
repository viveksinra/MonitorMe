import Bonjour from 'bonjour-service';
import os from 'node:os';
import { DEFAULT_AGENT_PORT, SERVICE_PROTOCOL, SERVICE_TYPE } from '@monitorme/common';

export function startAdvertisement(deviceId: string, port = DEFAULT_AGENT_PORT) {
  const bonjour = new Bonjour();
  const host = os.hostname();
  const service = bonjour.publish({
    name: `MonitorMe-${host}`,
    type: SERVICE_TYPE,
    protocol: SERVICE_PROTOCOL as any,
    port,
    txt: { deviceId, host }
  });

  service.start();
  return () => service.stop();
}


