import {IDiscoveryService} from './IDiscoveryService';
import {ClusterConfig} from '../../model/system/Cluster';
import {Node} from '../../model/system/Node';
import {Logger} from '../../util/Logger';

export class StaticDiscoveryService implements IDiscoveryService {
    public constructor(private readonly clusterConfig: ClusterConfig) {}

    public async discoverNodes(): Promise<Node[]> {
        Logger.log(`[StaticDiscoveryService] discovering on ${this.clusterConfig.nodes.length} statically configured nodes`);
        return this.clusterConfig.nodes.filter((nodeConfig) => !nodeConfig.isSelf);
    }
}
