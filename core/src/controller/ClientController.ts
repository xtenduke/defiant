import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import {ProtoGrpcType} from '../../proto/gen/route_client_queue';
import {AddMessageResponse} from '../../proto/gen/client_queue/AddMessageResponse';
import {AddMessageRequest} from '../../proto/gen/client_queue/AddMessageRequest';
import {UnicastMessageRequest} from '../../proto/gen/client_queue/UnicastMessageRequest';
import {UnicastMessage} from '../../proto/gen/client_queue/UnicastMessage';
import {ServerUnaryCall, ServerWritableStream, ServiceDefinition} from '@grpc/grpc-js';
import {Logger} from '../util/Logger';
import {QueueDefinition, QueueHandlers} from '../../proto/gen/client_queue/Queue';
import {ConfirmMessageRequest} from '../../proto/gen/client_queue/ConfirmMessageRequest';
import {ConfirmMessageResponse} from '../../proto/gen/client_queue/ConfirmMessageResponse';
import * as crypto from 'crypto';
import {BaseRPCController} from '../base/BaseRPCController';
import {Server} from './Server';

export interface Message extends AddMessageRequest {
    id: string;
    queueId: string;
    sentAt?: Date;
    attempts?: number;
}

export interface QueueListener {
    id: string;
    stream: ServerWritableStream<UnicastMessageRequest, UnicastMessage>;
}

export interface Config {
    messageMaxSendAttempts: number;
    messageBaseRetryDelay: number;
}

export class ClientController extends BaseRPCController<QueueHandlers> {
    private readonly listeners: Map<string, Array<QueueListener>>;
    private readonly queuedMessages: Array<Message>;
    private readonly unconfirmedMessages: Map<string, Message>;
    private processing: boolean;

    public constructor(
        protected readonly config: Config,
        protected readonly server: Server
    ) {
        super(server);
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
            Logger.error('[ListenToMessages] called without a queue id');
            call.end();
        }

        let queueListeners = this.listeners.get(queueId);
        if (!queueListeners) {
            queueListeners = [];
        }

        const listenerId = crypto.randomUUID();

        const closeListener = (error?: Error) => {
            if (error) {
                Logger.log(`[CloseListener] called for listener on queue ${queueId} with error`, error);
            } else {
                Logger.log(`[CloseListener] called for listener on queue ${queueId}`);
            }
            this.RemoveListener(queueId, listenerId);
        };

        call.on('finish', closeListener);
        call.on('error', closeListener);
        call.on('close', closeListener);
        // call.on('drain', closeListener); todo: support task drain?

        queueListeners.push({ stream: call, id: listenerId });
        this.listeners.set(queueId, queueListeners);
        // not going to call `call.end();` as we will wait for the connection to die, or the client to close
    }

    private RemoveListener(queueId: string, listenerId: string) {
        const queueListeners = this.listeners.get(queueId);
        if (queueListeners && queueListeners.length > 0) {
            const index = queueListeners.findIndex((listener) => listener.id === listenerId);
            if (index > -1) {
                queueListeners.splice(index, 1);
                this.listeners.set(queueId, queueListeners);
                Logger.log(`[RemoveListener] removed listener for queue ${queueId}`);
            } else {
                Logger.log(`[RemoveListener] couldn't find listener to remove for queue ${queueId}`);
            }
        } else {
            Logger.log(`[RemoveListener] no listeners for queue queue ${queueId}`);
        }
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

    public GetListenerForQueue(queueId: string): QueueListener | undefined {
        const listeners = this.listeners.get(queueId);
        const random = listeners.length > 1 ? Math.floor(Math.random() * listeners.length) : 0;
        const listener = listeners[random];
        if (listener && (!listener.stream.writable || listener.stream.cancelled || listener.stream.destroyed)) {
            this.RemoveListener(queueId, listener.id);
            return this.GetListenerForQueue(queueId);
        } else {
            return listener;
        }
    }

    private async processNext() {
        const message = this.queuedMessages.shift();

        if (message) {
            const listener = this.GetListenerForQueue(message.queueId);
            if (!listener) {
                Logger.log(`[ProcessNext] no listener found for queueId: ${message.queueId}, discarding`);
                // TODO: add to DLQ
                return;
            } else if (message.attempts === this.config.messageMaxSendAttempts) {
                Logger.log('[ProcessNext] message hit max attempts, discarding', message);
                // TODO: add to DLQ
                return;
            } else {
                Logger.log(`[ProcessNext] write message for queueId: ${message.queueId} to listener ${message.queueId}:${listener.id}`);
            }

            message.attempts += 1;
            message.sentAt = new Date();

            listener.stream.write(message, (error) => {
                if (error) {
                    Logger.log('[ProcessNext] message send failed', error, message);
                    // add back to queue for re-send
                    this.queuedMessages.push(message);
                } else {
                    Logger.log('[ProcessNext] message send succeeded', message);
                }
            });

            // Handle delivery management outside of callback
            this.unconfirmedMessages.set(message.id, message); // add me to unconfirmed messages
            const time = this.config.messageBaseRetryDelay * message.attempts;
            Logger.debug(`[ProcessNext] queued delivery check for ${time}ms`, message);
            setTimeout(async () => {
                // check confirmed
                Logger.debug('[ProcessNext] running delivery check', message);
                await this.checkDeliveryReceiptOrQueue(message.id);
            }, time);
        }

        if (this.processing) {
            setTimeout(async () => {
                await this.processNext();
            });
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
            Logger.debug('[CheckDeliveryReceiptOrQueue] unconfirmed delivery, re-queuing', messageId);
            this.unconfirmedMessages.delete(messageId);
            this.queuedMessages.push(unconfirmedMessage);
        } else {
            Logger.debug('[CheckDeliveryReceiptOrQueue] confirmed delivery', messageId);
        }
    }

    protected getService(): ServiceDefinition<QueueDefinition> {
        const packageDefinition = protoLoader.loadSync('../proto/route_client_queue.proto');
        // typing from grpc-js sucks
        const protoService = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
        return protoService.client_queue.Queue.service;
    }

    protected getHandlers(): QueueHandlers {
        return {
            AddMessage: this.AddMessage.bind(this),
            ListenForMessages: this.ListenToMessages.bind(this),
            ConfirmMessage: this.ConfirmMessage.bind(this),
        };
    }

}