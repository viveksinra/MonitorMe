import Bonjour from 'bonjour-service';
import { SERVICE_PROTOCOL, SERVICE_TYPE } from './constants.js';
export function discoverAgents(onUpdate) {
    const bonjour = new Bonjour();
    const browser = bonjour.find({ type: SERVICE_TYPE, protocol: SERVICE_PROTOCOL });
    const agents = new Map();
    const push = () => onUpdate(Array.from(agents.values()));
    browser.on('up', (s) => {
        const host = s.host || s.fqdn || 'unknown';
        const port = s.port || 0;
        const deviceId = s.txt?.deviceId;
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
//# sourceMappingURL=discovery.js.map