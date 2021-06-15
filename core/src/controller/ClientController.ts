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
import {BaseRPCController} from './BaseRPCController';
import {Server} from '../core/Server';
import {QueueService} from '../service/QueueService';

export interface QueueListener {
    id: string;
    stream: ServerWritableStream<UnicastMessageRequest, UnicastMessage>;
}

export class ClientController extends BaseRPCController<QueueHandlers> {
    public constructor(
        protected readonly queueService: QueueService,
        protected readonly server: Server
    ) {
        super(server);
    }

    private AddMessage(
        call: ServerUnaryCall<AddMessageRequest, AddMessageResponse>,
        callback: grpc.sendUnaryData<AddMessageResponse>
    ) {
        Logger.log('Request to AddMessage:', call.request);

        if (!call.request.queueId) {
            Logger.error('Someone called [AddMessage] without a queueId');
            callback(undefined, {
                info: 'missing queueId',
                success: false,
            });
            return;
        }

        this.queueService.onAddMessage(call.request).then(() => {
            callback(null, {
                info: `Enqueued message: ${call.request.data}`,
                success: true,
            });
        }).catch((err?: Error) => {
            callback(err, {
                info: `error adding message ${err?.message}`,
                success: false,
            });
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

        this.queueService.onListenToMessages(call).catch((err?: Error) => {
            Logger.error('[ListenToMessages] failed with error', err);
            call.end();
        });
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

            callback(null, {
                info: `missing ${queueId ? 'messageId' : 'queueId'}`,
                success: false,
            });

            return;
        }

        this.queueService.onConfirmMessage(call.request).then(() => {
            callback(null, {
                info: `Confirmed message: ${messageId}`,
                success: true,
            });
        }).catch((err?: Error) => {
            callback(err, {
                info: `Error confirming message ${err?.message}`,
                success: false,
            });
        });
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