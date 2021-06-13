import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {PackageDefinition} from "@grpc/grpc-js/build/src/make-client";
import {ProtoGrpcType} from "../proto/route_client_queue";
import {AddMessageResponse} from "../proto/client_queue/AddMessageResponse";
import {AddMessageRequest} from "../proto/client_queue/AddMessageRequest";
import {UnicastMessageRequest} from "../proto/client_queue/UnicastMessageRequest";
import {UnicastMessage} from "../proto/client_queue/UnicastMessage";
import {ServerUnaryCall, ServerWritableStream} from "@grpc/grpc-js";
import {Logger} from "./util/Logger";
import {QueueHandlers} from "../proto/client_queue/Queue";
import {ConfirmMessageRequest} from "../proto/client_queue/ConfirmMessageRequest";
import {ConfirmMessageResponse} from "../proto/client_queue/ConfirmMessageResponse";
import * as crypto from "crypto";

export interface Message extends AddMessageRequest {
    id: string;
    queueId: string;
    sentAt?: Date;
    attempts?: number;
}

export class RPCServer {
    private readonly MESSAGE_SEND_MAX_ATTEMPTS = 5;
    private readonly MESSAGE_SEND_BASE_DELAY = 30000;
    private readonly CLIENT_QUEUE_PROTO_PATH = './proto/route_client_queue.proto';
    private readonly packageDefinition: PackageDefinition;
    private readonly proto: ProtoGrpcType;

    private readonly listeners: Map<string, Array<ServerWritableStream<UnicastMessageRequest, UnicastMessage>>>;
    private readonly queuedMessages: Array<Message>;
    private readonly unconfirmedMessages: Map<string, Message>;
    private processing: boolean;

    public constructor(private readonly port: number) {
        this.packageDefinition = protoLoader.loadSync(this.CLIENT_QUEUE_PROTO_PATH);
        this.proto = grpc.loadPackageDefinition(this.packageDefinition) as unknown as ProtoGrpcType;
        this.listeners = new Map();
        this.queuedMessages = [];
        this.unconfirmedMessages = new Map();
    }

    private AddMessage(
        call: ServerUnaryCall<AddMessageRequest, AddMessageResponse>,
        callback: grpc.sendUnaryData<AddMessageResponse>
    ) {
        Logger.log('Request to AddMessage:', call.request);
        const queueId = call.request.queueId;
        if (!queueId) {
            Logger.error('Someone called [AddMessage] without a queueId');

            // look up how error handling works here
            callback(null, {
                info: `missing queueId: ${call.request.data}`,
                success: false,
            });

            return;
        }

        // get queue matching queueId
        // validate this message & queue
        const messageId = crypto.randomUUID();

        this.queuedMessages.push({
            id: messageId,
            attempts: 0,
            queueId: queueId,
            ...call.request
        });

        callback(null, {
            info: `Enqueued message: ${call.request.data}`,
            success: true,
        });
    }

    private ListenToMessages(
        call: ServerWritableStream<UnicastMessageRequest, UnicastMessage>,
    ) {
        Logger.log('[ListenToMessages] Request for unicast listen on queue:', call.request);

        // perform some validation on our listeners..
        // eventually negotiate some authorization
        // -- here 'queues' should be created through other means, i.e. another endpoint -- probably not, due to no persistent storage

        const queueId = call.request.queueId;
        if (!queueId) {
            // no error handling for the moment
            Logger.error('[ListenToMessages] called without a queue id')
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

    private ConfirmMessage(
        call: ServerUnaryCall<ConfirmMessageRequest, ConfirmMessageResponse>,
        callback: grpc.sendUnaryData<ConfirmMessageResponse>
    ) {
        Logger.log('[ConfirmMessage]', call.request);
        const queueId = call.request.queueId;
        const messageId = call.request.messageId;
        if (!queueId || !messageId) {
            Logger.error(`[ConfirmMessage] called without a ${queueId ? 'messageId' : 'queueId'}`);

            // look up how error handling works here
            callback(null, {
                info: `missing ${queueId ? 'messageId' : 'queueId'}`,
                success: false,
            });

            return;
        }

        const message = this.unconfirmedMessages.get(messageId);
        if (!message) {
            callback(null, {
                info: `no message for id ${messageId}`,
                success: false,
            });

            return;
        }

        // complete
        this.unconfirmedMessages.delete(messageId);

         callback(null, {
             info: `Confirmed message: ${messageId}`,
             success: true,
        });
    }

    public async processMessages(): Promise<void> {
        if (this.processing) {
            return;
        } else {
            this.processing = true;
        }

        Logger.log('[ProcessMessages] Begin');
        await this.processNext();
    }

    private async processNext() {
        const message = this.queuedMessages.shift();
        if (message) {
            const listeners = this.listeners.get(message.queueId);
            // pick a random listener to send to
            const random = Math.floor(Math.random() * listeners.length); // can probably think of a more clever way to do this
            // listeners could be weighted
            const listener = listeners[random];
            if (!listener) {
                Logger.log(`[ProcessNext] no listener found for queueId: ${message.queueId}, discarding`);
                // TODO: add to DLQ
            } else if (message.attempts === this.MESSAGE_SEND_MAX_ATTEMPTS) {
                Logger.log(`[ProcessNext] message hit max attempts, discarding`, message);
                // TODO: add to DLQ
            } else {
                Logger.log(`[ProcessNext] write message for queueId: ${message.queueId} to listener ${message.queueId}:${random}`);
            }

            message.attempts += 1;
            message.sentAt = new Date();

            listener.write(message, (error) => {
                if (error) {
                    Logger.log(`[ProcessNext] message send failed`, error);
                    // add back to queue for re-send
                    this.queuedMessages.push(message);
                } else {
                    Logger.log(`[ProcessNext] message send succeeded`);
                    this.unconfirmedMessages.set(message.id, message); // add me to unconfirmed messages

                    setTimeout(async () => {
                        // check confirmed
                        await this.checkDeliveryReceiptOrQueue(message.id);
                    }, this.MESSAGE_SEND_BASE_DELAY * message.attempts);
                }
            });
        }

        if (this.processing) {
            setTimeout(async () => {
                await this.processNext();
            }, 0);
        }
    }

    /**
     * Check if delivery receipt has been taken
     * If so, do nothing
     * If not, re-Qeueue message
     * @param messageId the id for the message to check
     */
    private async checkDeliveryReceiptOrQueue(messageId: string): Promise<void> {
        const unconfirmedMessage = this.unconfirmedMessages.get(messageId);
        if (unconfirmedMessage) {
            this.unconfirmedMessages.delete(messageId);
            this.queuedMessages.push(unconfirmedMessage);
        }
    }

    public async startServer(): Promise<void> {
        Logger.log('Start server on port:', this.port);
        const server = new grpc.Server();
        // todo: imporve typing here
        const functions: QueueHandlers = {
            AddMessage: this.AddMessage.bind(this),
            ListenForMessages: this.ListenToMessages.bind(this),
            ConfirmMessage: this.ConfirmMessage.bind(this),
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