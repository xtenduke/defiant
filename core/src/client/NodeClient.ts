import {Node} from '../service/NodeService';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import {ProtoGrpcType} from '../../proto/gen/route_node_router';
import {NodeClient} from '../../proto/gen/node_router/Node';
import {Logger} from '../util/Logger';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';
import {EventLoop} from '../util/EventLoop';
import {BaseRPCClient, BaseRPCClientConfig} from './BaseRPCClient';

export class NodeLinkClient extends BaseRPCClient {
    private readonly client: NodeClient;

    public constructor(
        protected readonly clientConfig: BaseRPCClientConfig,
        protected readonly nodeConfig: Node,
        private readonly nodeId: string
    ) {
        super(clientConfig);
        const packageDefinition = protoLoader.loadSync('../proto/route_node_router.proto');
        const protoService = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
        this.client = new protoService.node_router.Node(
            `${nodeConfig.host}:${nodeConfig.port}`, grpc.credentials.createInsecure(), this.getGRPCConfig());
    }

    public getIdentity(): string {
        return `${this.nodeConfig.host}:${this.nodeConfig.port}`;
    }

    public async interrogate(attempt = 1): Promise<InterrogateResponse> {
        const maxAttempts = 100;
        const interrogateRequest = {
            nodeId: this.nodeId,
        };

        try {
            return await this.fireInterrogateRequest(interrogateRequest, attempt);
        } catch (e) {
            if (maxAttempts === attempt) {
                throw new Error(`[Linkclient] Client interrogate to node at ${this.nodeConfig.host}:${this.nodeConfig.port}, failed at max attempts`);
            } else {
                Logger.debug(`[LinkClient] Waiting for ${this.nodeConfig.host}:${this.nodeConfig.port} to come up, retry attempt ${attempt}`);
                await EventLoop.sleep(10 ** attempt);
                return await this.interrogate(attempt + 1);
            }
        }
    }

    private async fireInterrogateRequest(request: InterrogateRequest, attempt: number): Promise<InterrogateResponse> {
        return new Promise((resolve, reject) => {
            this.client.Interrogate(request, { deadline: this.getDeadline() }, (err, response) => {
                if (err) {
                    Logger.debug(`[LinkClient] Client interrogate to node at ${this.nodeConfig.host}:${this.nodeConfig.port}, attempt ${attempt} failed with error`, err);
                    reject(err);
                } else {
                    Logger.debug(`[LinkClient] Client interrogate to node at ${this.nodeConfig.host}:${this.nodeConfig.port} attempt ${attempt} succeeded with`, response);
                    resolve(response);
                }
            });
        });
    }
}