import {ClusterConfig} from './NodeService';
import {NodeLinkClient} from '../client/NodeClient';
import {Logger} from '../util/Logger';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';

export class ClusterManager {
    private readonly clients: NodeLinkClient[];

    public constructor(
        private readonly clientConfig: BaseRPCClientConfig,
        private readonly config: ClusterConfig,
        private readonly currentNodeId: string
    ) {
        // construct clients
        this.clients = config.nodes.filter((nodeConfig) => !nodeConfig.isSelf).map((nodeConfig) => {
            return new NodeLinkClient(clientConfig, nodeConfig, currentNodeId);
        });
    }

    public async testInterrogate(): Promise<void> {
        Logger.log(`[ClusterManager] testInterrogate start for ${this.clients.length} nodes`);

        for (const client of this.clients) {
            try {
                const result = await client.interrogate();
                Logger.log(`[ClusterManager] test interrogate success for node ${client.getIdentity()}`, result);
            } catch (e) {
                Logger.error(`[ClusterManager] test interrogate failed for node ${client.getIdentity()}`);
            }
        }

        Logger.log(`[ClusterManager] interrogate complete on node ${this.currentNodeId}`);
    }
}