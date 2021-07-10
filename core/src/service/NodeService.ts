import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';
import {ClusterConfig} from '../model/system/Cluster';

export class NodeService {
    public constructor(private readonly config: ClusterConfig, private readonly nodeId: string) {}

    public async onInterrogate(request: InterrogateRequest): Promise<InterrogateResponse> {
        return {
            nodeId: this.nodeId,
        };
    }
}