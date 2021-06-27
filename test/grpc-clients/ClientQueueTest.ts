import * as grpc from '@grpc/grpc-js';
import * as protoLoader from'@grpc/proto-loader';
import * as path from 'path';
import {ConfirmMessageRequest} from '../../core/proto/gen/client_queue/ConfirmMessageRequest';
import {ProtoGrpcType} from '../../core/proto/gen/route_client_queue';
import {QueueClient} from '../../core/proto/gen/client_queue/Queue';
import {UnicastMessage, UnicastMessage__Output} from '../../core/proto/gen/client_queue/UnicastMessage';
import {Redirect} from '../../core/proto/gen/client_queue/Redirect';
import {AddMessageResponse} from '../../core/proto/gen/client_queue/AddMessageResponse';
import {ConfirmMessageResponse} from '../../core/proto/gen/client_queue/ConfirmMessageResponse';
import {AddMessageRequest} from '../../core/proto/gen/client_queue/AddMessageRequest';
import {Code} from '../../core/proto/gen/client_queue/Code';

export class ClientQueueTest {
    private addedMessages = 0;
    private receivedMessages = 0;
    private confirmedMessages = 0;
    private client: QueueClient;
    private messageStream: grpc.ClientReadableStream<UnicastMessage__Output>;
    private isReady = false;

    public constructor(
        private readonly queueId: string,
        private readonly clientId: string,
    ) {

        this.isReady = true;
        this.client = ClientQueueTest.createClient('localhost', 8080);
    }

    private static createClient(host: string, port: number): QueueClient {
        const packageDefinition = protoLoader.loadSync(
            path.join(__dirname, '../../../../proto/route_client_queue.proto'),
            {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true
            });

        const client_queue_proto = grpc.loadPackageDefinition(packageDefinition) as unknown as ProtoGrpcType;
        const target = `${host}:${port}`;

        return new client_queue_proto.client_queue.Queue(target,
            grpc.credentials.createInsecure(), {
                'grpc.keepalive_time_ms': 30000, // must be less than max total backoff
                'grpc.keepalive_timeout_ms': 5000, // time to wait for pong
                'grpc.keepalive_permit_without_calls': 1, // send keepalive even if there are no actual calls
                'grpc.http2.max_pings_without_data': 0
            }
        );
    }

    public listen() {
        const listenMessageRequest = {
            metadata: {
                queueId: this.queueId,
            },
        }

        this.messageStream = this.client.listenForMessages(listenMessageRequest).on('data', (response: UnicastMessage) => {
            if (this.messageStream.destroyed) {
                console.warn(`[${this.clientId}] Message stream received message on destroyed stream` + JSON.stringify(response));
                return;
            }

            console.log(`[${this.clientId}] Message stream on data` + JSON.stringify(response));
            if (response && Code[response.metadata.code] === Code.SUCCESS) {

                this.isReady = true;
                    if (!response.data) {
                        // just control message
                        this.sendMessages();
                    } else {
                        this.receivedMessages += 1;
                        this.logStatistics();
                        const confirmMessageRequest = {
                            metadata: {
                                queueId: listenMessageRequest.metadata.queueId,
                            },
                            messageId: response.id,
                        };

                        this.confirmMessage(confirmMessageRequest);
                    }
                } else if (response && Code[response.metadata.code] === Code.REDIRECT) {
                    this.onRedirectInstruction(response.metadata.redirect);
                } else {
                    console.error(`[${this.clientId}] Message stream error ` + JSON.stringify(response));
                }
            }
        )

        console.log(`[${this.clientId}] Message stream on listen complete`);
    }

    public sendMessages() {
        const addMessageRequest: AddMessageRequest = {
            metadata: {
                queueId: this.queueId,
            },
            data: 'heyit\'sjustsomeutf8stringwhatareyougoingtodoaboutit',
        }

        for (let i = 0; i < 1000; i++) {
            if (!this.isReady) {
                break;
            }

            this.client.addMessage(addMessageRequest, {deadline: this.getDeadline()}, (err, response: AddMessageResponse) => {
                if (err) {
                    console.error(`[${this.clientId}] Caught error on addmessage handler`, err);
                    return;
                }

                if (response && Code[response.metadata.code] === Code.SUCCESS) {
                    this.logStatistics();
                    this.addedMessages += 1;
                } else if (response && Code[response.metadata.code] === Code.REDIRECT) {
                    this.onRedirectInstruction(response.metadata.redirect);
                } else {
                    console.error(`[${this.clientId}] unknown response error on addmessage handler`, JSON.stringify(response));
                }
            });
        }
    }

    private confirmMessage(confirmMessageRequest: ConfirmMessageRequest) {
        this.client.confirmMessage(confirmMessageRequest, { deadline: this.getDeadline()},
            (error, response: ConfirmMessageResponse) => {
                if (error) {
                    console.error(`[${this.clientId}] Confirming message failed`, error);
                } else if (response && Code[response.metadata.code] === Code.SUCCESS) {
                    this.confirmedMessages += 1;
                    this.logStatistics();
                } else if (response && Code[response.metadata.code] === Code.REDIRECT) {
                    this.onRedirectInstruction(response.metadata.redirect);
                } else {
                    console.log(`[${this.clientId}] Got error message confirming message` + JSON.stringify(response));
                }
            });
    }

    private onRedirectInstruction(redirect: Redirect) {
        if (!this.isReady) {
            return;
        }

        console.log(`[${this.clientId}] Issued redirect ` + JSON.stringify(redirect));
        this.isReady = false;

        this.messageStream.destroy();
        this.client.close();
        this.client = ClientQueueTest.createClient(redirect.host, redirect.port);
        console.log(`[${this.clientId}] create redirected client`);
        this.listen();
    }

    private getDeadline(time = 10000) {
        return new Date(Date.now() + time);
    }

    private logStatistics() {
        console.log(`[${this.clientId}] Added: ${this.addedMessages} - Received ${this.receivedMessages} - Confirmed ${this.confirmedMessages}`);
    }
}

const client = new ClientQueueTest(process.env.QUEUE_ID, process.env.CLIENT_ID);
client.listen();
client.sendMessages();

