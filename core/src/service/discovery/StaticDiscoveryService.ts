import {IDiscoveryService} from './IDiscoveryService';
import {ClusterConfig} from '../../model/system/Cluster';
import {Node} from '../../model/system/Node';

export class StaticDiscoveryService implements IDiscoveryService {
    public constructor(private readonly clusterConfig: ClusterConfig) {}

    public async discoverNodes(): Promise<Node[]> {
        return this.clusterConfig.nodes.filter((nodeConfig) => !nodeConfig.isSelf);
    }
}