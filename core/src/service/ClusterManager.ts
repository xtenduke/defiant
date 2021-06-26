import {ClusterConfig} from './NodeService';
import {NodeLinkClient} from '../client/NodeClient';
import {Logger} from '../util/Logger';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';
import HashRing from 'hashring';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';

export class ClusterManager {
    private readonly clients: NodeLinkClient[];
    private hashRing: HashRing;

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

    public async start(): Promise<void> {
        const result = await this.interrogate();
        this.hashRing = this.populateHashRing(result, this.currentNodeId);
    }

    private async interrogate(): Promise<InterrogateResponse[]> {
        const result = Promise.all(this.clients.map(async (client) => {
            return client.interrogate();
        }));

        Logger.log(`[ClusterManager] interrogate complete on node ${this.currentNodeId}`);

        return result;
    }

    private populateHashRing(nodes: InterrogateResponse[], currentNodeId: string): HashRing {
        const nodeIds = nodes.map((node) => node.nodeId);
        nodeIds.push(currentNodeId);

        return new HashRing(nodeIds);
    }
}