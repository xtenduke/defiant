import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {PackageDefinition} from "@grpc/grpc-js/build/src/make-client";
import {ProtoGrpcType} from "../proto/route_client_queue";
import {AddMessageReply} from "../proto/client_queue/AddMessageReply";
import {AddMessageRequest} from "../proto/client_queue/AddMessageRequest";
import {UnicastMessageRequest} from "../proto/client_queue/UnicastMessageRequest";
import {UnicastMessage} from "../proto/client_queue/UnicastMessage";
import {ServerUnaryCall, ServerWritableStream} from "@grpc/grpc-js";
import {Logger} from "./util/Logger";
import {QueueHandlers} from "../proto/client_queue/Queue";

export class RPCServer {
    private readonly CLIENT_QUEUE_PROTO_PATH = './proto/route_client_queue.proto';
    private readonly packageDefinition: PackageDefinition;
    private readonly proto: ProtoGrpcType;

    private readonly listeners: Map<string, Array<ServerWritableStream<UnicastMessageRequest, UnicastMessage>>>;
    private readonly messages: Array<AddMessageRequest>;
    private processing: boolean;

    public constructor(private readonly port: number) {
        this.packageDefinition = protoLoader.loadSync(this.CLIENT_QUEUE_PROTO_PATH);
        this.proto = grpc.loadPackageDefinition(this.packageDefinition) as unknown as ProtoGrpcType;
        this.listeners = new Map();
        this.messages = [];
    }

    private AddMessage(
        call: ServerUnaryCall<AddMessageRequest, AddMessageReply>,
        callback: grpc.sendUnaryData<AddMessageReply>
    ) {
        Logger.log('Request to AddMessage:', call.request);
        const queueId = call.request.queueId;
        if (!queueId) {
            Logger.error('Someone called [AddMessage] without a queueId');

            // look up how error handling works here
            callback(null, {
                message: `missing queueId: ${call.request.data}`,
                success: false,
            });

            return;
        }

        // get queue matching queueId
        // validate this message & queue
        this.messages.push(call.request);

        callback(null, {
            message: `Enqueued message: ${call.request.data}`,
            success: true,
        });
    }

    // TODO: grpc endpoint for taking receipt of processed message

    private ListenToMessages(
        call: ServerWritableStream<UnicastMessageRequest, UnicastMessage>,
    ) {
        Logger.log('Request for unicast listen on queue:', call.request);

        // perform some validation on our listeners..
        // eventually negotiate some authorization
        // -- here 'queues' should be created through other means, i.e. another endpoint -- probably not, due to no persistent storage

        const queueId = call.request.queueId;
        if (!queueId) {
            // no error handling for the moment
            Logger.error('Someone called [ListenToMessages] without a queue id')
            call.end();
        }

        let queueListeners = this.listeners.get(queueId);
        if (!queueListeners) {
            queueListeners = [];
        }

        queueListeners.push(call);
        this.listeners.set(queueId, queueListeners);
        // not going to call `call.end();` as we will wait for the connection to die, or the client to close
    }

    public async processMessages(): Promise<void> {
        // can't just pop messages off and fire them
        // we need a way to listen to process receipt from the client
        // ok for the meantime
        if (this.processing) {
            return;
        } else {
            this.processing = true;
        }

        Logger.log('[ProcessMessages] Begin');
        // I need worker threads please
        await this.processNext();
    }

    private async processNext() {
        const message = this.messages.shift();
        if (message) {
            const listeners = this.listeners.get(message.queueId);
            // pick a random listener to send to
            const random = Math.floor(Math.random() * this.listeners.size); // can probably think of a more clever way to do this
            // listeners could be weighted
            const listener = listeners[random];
            if (!listener) {
                Logger.log(`[ProcessNext] no listener found for queueId: ${message.queueId}`);
            }
            listener.write(message);
        }

        if (this.processing) {
            setTimeout(async () => {
                await this.processNext();
            }, 0);
        }
    }

    public async startServer(): Promise<void> {
        Logger.log('Start server on port:', this.port);
        const server = new grpc.Server();
        // todo: imporve typing here
        const functions: QueueHandlers = {
            AddMessage: this.AddMessage.bind(this),
            ListenForMessages: this.ListenToMessages.bind(this),
        };
        server.addService(this.proto.client_queue.Queue.service, functions);

        server.bindAsync(
            `0.0.0.0:${this.port}`,
            grpc.ServerCredentials.createInsecure(),
            (err: Error | null, port: number) => {
                if (err) {
                    Logger.error('error starting server:', err.message);
                    throw err;
                } else {
                    Logger.debug('Server bound on port', port);
                    server.start();

                    // yuck
                    this.processMessages();
                }
            });
    }

    public async stopProcessing() {
        this.processing = false;
    }

    // graceful shutdown would be nice too
}