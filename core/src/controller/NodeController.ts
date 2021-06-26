import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {BaseRPCController} from './BaseRPCController';
import {NodeService} from '../service/NodeService';
import {Server} from '../core/Server';
import {NodeHandlers} from '../../proto/gen/node_router/Node';
import {ServerUnaryCall, ServiceDefinition} from '@grpc/grpc-js';
import {InterrogateRequest} from '../../proto/gen/node_router/InterrogateRequest';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';
import {ProtoGrpcType} from '../../proto/gen/route_node_router';

export class NodeController extends BaseRPCController<NodeHandlers> {
    public constructor(
        protected readonly nodeService: NodeService,
        protected readonly server: Server,
    ) {
        super(server);
    }

    private Interrogate(
        call: ServerUnaryCall<InterrogateRequest, InterrogateResponse>,
        callback: grpc.sendUnaryData<InterrogateResponse>,
    ) {
        if (!call.request.nodeId) {
            callback(null, {
                success: false,
                message: 'Missing nodeId',
            });
        }

        this.nodeService.onInterrogate(call.request).then((response: InterrogateResponse) => {
            callback(null, response);
        }).catch((err?: Error) => {
            callback(err, null);
        });
    }

    protected getHandlers(): NodeHandlers {
        return {
            Interrogate: this.Interrogate.bind(this),
        };
    }

    protected getService(): ServiceDefinition<NodeHandlers> {
        const packageDefinition = protoLoader.loadSync('../proto/route_node_router.proto');
        const protoService = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
        return protoService.node_router.Node.service;
    }
}