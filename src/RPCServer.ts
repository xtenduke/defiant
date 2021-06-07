import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {PackageDefinition} from "@grpc/grpc-js/build/src/make-client";
import {ProtoGrpcType} from "../proto/route_client_queue";
import {AddMessageReply} from "../proto/client_queue/AddMessageReply";
import {AddMessageRequest} from "../proto/client_queue/AddMessageRequest";
import {ServerUnaryCall} from "@grpc/grpc-js";

export class RPCServer {
    private readonly CLIENT_QUEUE_PROTO_PATH = './proto/route_client_queue.proto';
    private readonly packageDefinition: PackageDefinition;
    private readonly proto: ProtoGrpcType;

    public constructor(private readonly port: number) {
        this.packageDefinition = protoLoader.loadSync(this.CLIENT_QUEUE_PROTO_PATH);
        this.proto = grpc.loadPackageDefinition(this.packageDefinition) as unknown as ProtoGrpcType;
    }

    private AddMessage(
        call: ServerUnaryCall<AddMessageRequest, AddMessageReply>,
        callback: grpc.sendUnaryData<AddMessageReply>
    ) {
        callback(null, {
            message: `you tried to enqueue message with data: ${call.request.data}`,
            success: true,
        });
    }

    public async startServer(): Promise<void> {
        console.log(`Start server on ${this.port}`);
        const server = new grpc.Server();
        server.addService(this.proto.client_queue.Queue.service, {
            AddMessage: this.AddMessage,
        });

        await server.bindAsync(
            `0.0.0.0:${this.port}`,
            grpc.ServerCredentials.createInsecure(),
            (err: Error | null, port: number) => {
                if (err) {
                    console.error(`Error starting server: ${err.message}`);
                    throw err;
                } else {
                    console.log(`Server bound at port: ${port}`)
                    server.start();
                }
        });
    }
}