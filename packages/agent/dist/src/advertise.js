import Bonjour from 'bonjour-service';
import os from 'node:os';
import { DEFAULT_AGENT_PORT, SERVICE_PROTOCOL, SERVICE_TYPE } from './constants.js';
export function startAdvertisement(deviceId, port = DEFAULT_AGENT_PORT) {
    const bonjour = new Bonjour();
    const host = os.hostname();
    const service = bonjour.publish({
        name: `MonitorMe-${host}`,
        type: SERVICE_TYPE,
        protocol: SERVICE_PROTOCOL,
        port,
        txt: { deviceId, host }
    });
    service.start();
    return () => service.stop();
}
//# sourceMappingURL=advertise.js.map