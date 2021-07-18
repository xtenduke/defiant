import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';

export class NodeService {
    public constructor(private readonly nodeId: string) {}

    public async onInterrogate(request: InterrogateRequest): Promise<InterrogateResponse> {
        return {
            nodeId: this.nodeId,
        };
    }
}
