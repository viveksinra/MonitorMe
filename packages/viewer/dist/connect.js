import { WebSocket } from 'ws';
export async function connectAndAuth(host, port, psk) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://${host}:${port}`);
        const to = setTimeout(() => reject(new Error('connect timeout')), 5000);
        ws.on('open', () => {
            ws.send(JSON.stringify({ type: 'auth', psk }));
        });
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg?.type === 'auth_ok') {
                    clearTimeout(to);
                    resolve(ws);
                }
            }
            catch { }
        });
        ws.on('error', reject);
    });
}
//# sourceMappingURL=connect.js.map