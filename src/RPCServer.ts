import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {PackageDefinition} from "@grpc/grpc-js/build/src/make-client";
import {ProtoGrpcType} from "../proto/route_client_queue";
import {GreeterHandlers} from "../proto/client_queue/Greeter";
import {HelloReply} from "../proto/client_queue/HelloReply";
import {HelloRequest} from "../proto/client_queue/HelloRequest";
import {ServerUnaryCall} from "@grpc/grpc-js";
import {Logger} from "./util/Logger";

export class RPCServer {
    private readonly CLIENT_QUEUE_PROTO_PATH = './proto/route_client_queue.proto';
    private readonly packageDefinition: PackageDefinition;
    private readonly proto: ProtoGrpcType;

    public constructor(private readonly port: number) {
        this.packageDefinition = protoLoader.loadSync(this.CLIENT_QUEUE_PROTO_PATH);
        this.proto = grpc.loadPackageDefinition(this.packageDefinition) as unknown as ProtoGrpcType;
    }

    // bc they must be string equal, dynamic codegen reflects in...
    private readonly handlers: GreeterHandlers = {
        SayHello(
            call: ServerUnaryCall<HelloRequest, HelloReply>,
            callback: grpc.sendUnaryData<HelloReply>
        ) {
            callback(null, {message: 'beans'});
        },

        SayHelloAgain(
            call: ServerUnaryCall<HelloRequest, HelloReply>,
            callback: grpc.sendUnaryData<HelloReply>
        ) {
            callback(null, {message: 'and again, beans'});
        }
    };

    public async startServer(): Promise<void> {
        Logger.log('Start server on port:', this.port);
        const server = new grpc.Server();
        server.addService(this.proto.client_queue.Greeter.service, this.handlers);

        await server.bindAsync(
            `0.0.0.0:${this.port}`,
            grpc.ServerCredentials.createInsecure(),
            (err: Error | null, port: number) => {
                if (err) {
                    Logger.error('error starting server:', err.message);
                    throw err;
                } else {
                    Logger.debug('Server bound on port', port);
                    server.start();
                }
        });
    }
}