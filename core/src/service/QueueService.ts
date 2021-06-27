import {Logger} from '../util/Logger';
import {QueueListener} from '../controller/ClientController';
import {AddMessageRequest} from '../../proto/gen/client_queue/AddMessageRequest';
import crypto from 'crypto';
import {ConfirmMessageRequest} from '../../proto/gen/client_queue/ConfirmMessageRequest';
import {ServerWritableStream} from '@grpc/grpc-js';
import {UnicastMessageRequest} from '../../proto/gen/client_queue/UnicastMessageRequest';
import {UnicastMessage} from '../../proto/gen/client_queue/UnicastMessage';
import {Code} from '../../proto/gen/client_queue/Code';

export interface Message extends UnicastMessage {
    id: string;
    queueId: string;
    sentAt?: Date;
    attempts?: number;
}

export interface Config {
    messageMaxSendAttempts: number;
    messageBaseRetryDelay: number;
}

export class QueueService {
    public constructor(
        private readonly config: Config,
    ) {
        this.listeners = new Map();
        this.queuedMessages = [];
        this.unconfirmedMessages = new Map();
    }

    private readonly listeners: Map<string, Array<QueueListener>>;
    private readonly queuedMessages: Array<Message>;
    private readonly unconfirmedMessages: Map<string, Message>;
    private processing: boolean;

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

            const response: UnicastMessage = {
                id: message.id,
                data: message.data,
                metadata: {
                    code: Code.SUCCESS,
                }
            };

            listener.stream.write(response, (error) => {
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

    public async onAddMessage(request: AddMessageRequest): Promise<void> {
        // check I am the correct instance for this queue
        // otherwise instruct client to connect to correct client


        // get queue matching queueId
        // validate this message & queue
        const messageId = crypto.randomUUID();

        this.queuedMessages.push({
            id: messageId,
            attempts: 0,
            queueId: request.metadata?.queueId,
            data: request.data,
        });
    }

    public async onConfirmMessage(request: ConfirmMessageRequest): Promise<void> {
        const message = this.unconfirmedMessages.get(request.messageId);
        if (!message) {
            throw new Error(`No message exists for id ${request.messageId}`);
        }

        // complete
        this.unconfirmedMessages.delete(request.messageId);
    }

    public async onListenToMessages(call: ServerWritableStream<UnicastMessageRequest, UnicastMessage>): Promise<void> {
        // eventually will have to have separate controller to handle listeners...
        const queueId = call.request.metadata?.queueId;
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
    }
}