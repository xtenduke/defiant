import {ClusterConfig} from './NodeService';
import {NodeLinkClient} from '../client/NodeClient';
import {Logger} from '../util/Logger';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';
import HashRing from 'hashring';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';

export interface ActiveNode {
    nodeId: string;
    host: string;
    port: number;
}

export class ClusterManager {
    private readonly clients: NodeLinkClient[];
    private hashRing: HashRing;
    private nodes: ActiveNode[];

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
        this.nodes = await this.interrogate();
        this.hashRing = this.populateHashRing(this.nodes, this.currentNodeId);
    }

    private async interrogate(): Promise<ActiveNode[]> {
        const result = Promise.all(this.clients.map(async (client) => {
            const interrogation = await client.interrogate();
            return {
                nodeId: interrogation.nodeId,
                host: client.getNodeConfig().host,
                port: client.getNodeConfig().port,
            };
        }));

        Logger.log(`[ClusterManager] interrogate complete on node ${this.currentNodeId}`);

        return result;
    }

    private populateHashRing(nodes: InterrogateResponse[], currentNodeId: string): HashRing {
        const nodeIds = nodes.map((node) => node.nodeId);
        nodeIds.push(currentNodeId);

        return new HashRing(nodeIds);
    }

    public getDestination(hash: string): ActiveNode {
        if (!this.hashRing) {
            throw new Error('Cluster not ready');
        }
        const destinationId = this.hashRing.get(hash);
        return this.nodes.find((node) => node.nodeId === destinationId);
    }
}