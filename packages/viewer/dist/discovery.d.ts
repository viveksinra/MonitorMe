export type DiscoveredAgent = {
    host: string;
    port: number;
    deviceId?: string;
};
export declare function discoverAgents(onUpdate: (agents: DiscoveredAgent[]) => void): () => void;
//# sourceMappingURL=discovery.d.ts.map