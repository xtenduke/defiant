import {NodeLinkClient} from '../client/NodeClient';
import {Logger} from '../util/Logger';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';
import HashRing from 'hashring';
import {Node} from '../model/system/Node';
import {IDiscoveryService} from './discovery/IDiscoveryService';

export class NodeLink {
    client: NodeLinkClient;
    node: Node;
}

export class ClusterManager {
    private nodeLinks: Map<string, NodeLink>;
    private hashRing: HashRing;

    public constructor(
        private readonly clientConfig: BaseRPCClientConfig,
        private readonly currentNodeId: string,
        private readonly discoveryService: IDiscoveryService
    ) {}

    public async start(): Promise<void> {
        this.nodeLinks = await this.discover();

        const nodes = Array.from(this.nodeLinks.values()).map((nodeLink) => nodeLink.node);
        this.hashRing = this.populateHashRing(nodes, this.currentNodeId);
    }

    private async discover(): Promise<Map<string, NodeLink>> {
        const links: Map<string, NodeLink> = new Map();
        const nodes = await this.discoveryService.discoverNodes();

        for (let node of nodes) {
            const key = this.getNodeLinkKey(node);
            let link = links.get(key);

            let client = link?.client;
            if (!client) {
                client = new NodeLinkClient(this.clientConfig, node, this.currentNodeId);
            }

            // interrogate
            const nodeId = await this.interrogate(client);
            node.nodeId = nodeId;

            links.set(nodeId, {
                client,
                node
            });
        }

        return links;
    }

    private getNodeLinkKey(node: Node): string {
        return `${node.host}${node.port}`;
    }


    private async interrogate(client: NodeLinkClient): Promise<string> {
        const interrogation = await client.interrogate();
        Logger.log(`[ClusterManager] interrogate complete on node ${this.currentNodeId}`);
        return interrogation.nodeId;
    }

    private populateHashRing(nodes: Node[], currentNodeId: string): HashRing {
        const nodeIds = nodes.map((node) => node.nodeId);
        nodeIds.push(currentNodeId);

        return new HashRing(nodeIds);
    }

    public getDestination(hash: string): Node {
        if (!this.hashRing) {
            throw new Error('Cluster not ready');
        }
        const destinationId = this.hashRing.get(hash);
        return this.nodeLinks.get(destinationId)?.node;
    }
}
