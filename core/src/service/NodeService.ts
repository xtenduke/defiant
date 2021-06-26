import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';

export interface ClusterConfig {
    nodes: Node[];
}

export interface Node {
    host: string;
    port: number;
    isSelf: boolean;
}

export class NodeService {
    public constructor(private readonly config: ClusterConfig, private readonly nodeId: string) {}

    public async onInterrogate(request: InterrogateRequest): Promise<InterrogateResponse> {
        return {
            nodeId: this.nodeId,
            isMaster: false,
        };
    }
}