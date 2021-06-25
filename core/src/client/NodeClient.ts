import {Node} from '../service/NodeService';
import * as protoLoader from '@grpc/proto-loader';
import * as grpc from '@grpc/grpc-js';
import {ProtoGrpcType} from '../../proto/gen/route_node_router';
import {NodeClient} from '../../proto/gen/node_router/Node';
import {Logger} from '../util/Logger';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';
import {EventLoop} from '../util/EventLoop';

export class NodeLinkClient {
    private readonly client: NodeClient;

    public constructor(private readonly config: Node, private readonly nodeId: string) {
        const packageDefinition = protoLoader.loadSync('../proto/route_node_router.proto');
        const protoService = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
        this.client = new protoService.node_router.Node(
            `${config.host}:${config.port}`, grpc.credentials.createInsecure(), {
                'grpc.keepalive_time_ms': 30000, // must be less than max total backoff
                'grpc.keepalive_timeout_ms': 5000, // time to wait for pong
                'grpc.keepalive_permit_without_calls': 1, // send keepalive even if there are no actual calls
                'grpc.http2.max_pings_without_data': 0,
            });

    }

    public getIdentity(): string {
        return `${this.config.host}:${this.config.port}`;
    }

    public async interrogate(attempt = 1): Promise<InterrogateResponse> {
        if (attempt > 1) {
            Logger.log(`Client interrogate to node at ${this.config.host}:${this.config.port}, begin retry ${attempt}`);
        }
        const maxAttempts = 100;
        const interrogateRequest = {
            nodeId: this.nodeId,
        };

        try {
            return await this.fireInterrogateRequest(interrogateRequest, attempt);
        } catch (e) {
            if (maxAttempts === attempt) {
                throw new Error(`Client interrogate to node at ${this.config.host}:${this.config.port}, failed at max attempts`);
            } else {
                Logger.log(`Client interrogate to node at ${this.config.host}:${this.config.port}, retry attempt ${attempt}`);
                await EventLoop.sleep(10 ** attempt);
                return await this.interrogate(attempt += 1);
            }
        }
    }

    private async fireInterrogateRequest(request: InterrogateRequest, attempt: number): Promise<InterrogateResponse> {
        return new Promise((resolve, reject) => {
            this.client.Interrogate(request, { deadline: this.getDeadline() }, (err, response) => {
                if (err) {
                    Logger.error(`Client interrogate to node at ${this.config.host}:${this.config.port}, attempt ${attempt} failed with error`, err);
                    reject(err);
                } else {
                    Logger.log(`Client interrogate to node at ${this.config.host}:${this.config.port} attempt ${attempt} succeeded with`, response);
                    resolve(response);
                }
            });
        });
    }

    private getDeadline(time = 10000) {
        return new Date(Date.now() + time);
    }
}