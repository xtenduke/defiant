import {Logger} from '../util/Logger';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';
import HashRing from 'hashring';
import {Node} from '../model/system/Node';
import {IDiscoveryService} from './discovery/IDiscoveryService';
import {IMembershipService, MembershipEventsCallback, NodeAdvertiseData, NodeLeftReason} from './membership/IMembershipService';

export class ClusterManager implements MembershipEventsCallback {
    private nodes: Map<string, Node> = new Map(); 
    private hashRing: HashRing;

    public constructor(
        private readonly clientConfig: BaseRPCClientConfig,
        private readonly currentNodeId: string,
        private readonly discoveryService: IDiscoveryService,
        private readonly membershipService: IMembershipService,
    ) {}

    public async start(): Promise<void> {
        Logger.log('ClusterManager started with config', this.clientConfig);
        this.hashRing = new HashRing([this.currentNodeId]);
        await this.discover();
    }

    private async discover(): Promise<void> {
        const nodes = await this.discoveryService.discoverNodes();
        this.membershipService.setCallback(this);
        await this.membershipService.onDiscoveredNodes(nodes);
    }

    // membership management stuff
    public onNodeAdded(node: NodeAdvertiseData): void {
        this.nodes.set(node.nodeId, node);
        this.hashRing.add(`${node.host}:${node.port}`);
    }

    public onNodeRemoved(node: NodeAdvertiseData, reason: NodeLeftReason): void {
        this.nodes.delete(node.nodeId);
        Logger.log('Node removed', reason)
        this.hashRing.remove(`${node.host}:${node.port}`)
    }

    public onNodeUpdate(node: NodeAdvertiseData): void {
        this.onNodeAdded(node);
    }

    public getDestination(hash: string): Node {
        if (!this.hashRing) {
            throw new Error('Cluster not ready');
        }
        const nodeId = this.hashRing.get(hash);
        return this.nodes.get(nodeId);
    }
}
