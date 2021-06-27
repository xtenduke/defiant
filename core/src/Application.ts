import {ClientController} from './controller/ClientController';
import {Logger} from './util/Logger';
import dotenv from 'dotenv';
import {Server} from './core/Server';
import {QueueService} from './service/QueueService';
import {randomUUID} from 'crypto';
import {NodeController} from './controller/NodeController';
import {NodeService} from './service/NodeService';
import {ClusterManager} from './service/ClusterManager';
import {JSONSafe} from './util/Json';
import {NodeDistributionMiddleware} from './middleware/NodeDistributionMiddleware';

export interface ApplicationConfig {
    port: number;
    nodeId: string;
    cluster: boolean;
}

export class Application {
    private readonly rpcServer: Server;
    private readonly config: ApplicationConfig;
    private readonly nodeId: string;

    private clientController: ClientController;
    private queueService: QueueService;

    private nodeController: NodeController;
    private nodeService: NodeService;

    private clusterManager: ClusterManager;
    private nodeDistributionMiddleware: NodeDistributionMiddleware;

    constructor() {
        this.nodeId = randomUUID();

        this.rpcServer = new Server({
            port: parseInt(process.env.CLIENT_RPC_PORT),
            grpcServerConfig: JSONSafe.parse(process.env.GRPC_CONNECTION_CONFIG),
        });

        this.config = {
            port: parseInt(process.env.CLIENT_RPC_PORT),
            nodeId: this.nodeId,
            cluster: JSONSafe.parse(process.env.CLUSTER)
        };

        Logger.updateContext({ nodeId: this.nodeId, port: this.config.port });
    }

    public async run(): Promise<void> {
        Logger.log(`Booting application, node: ${this.nodeId}`);

        await this.rpcServer.start();
        // bind controllers
        // some DI framework would be quite nice right now
        // config hack until we're containerised
        // JSONSafe should be removed when we have proper configuration loading and DI
        const clusterConfig = JSONSafe.parse(process.env.CLUSTER_CONFIG).map((config: {port: number}) => {
            return {
                ...config,
                isSelf: config.port === this.config.port,
            };
        });

        // cluster comms
        this.nodeService = new NodeService({
            nodes: clusterConfig,
        }, this.nodeId);

        this.nodeController = new NodeController(
            this.nodeService,
            this.rpcServer,
        );

        this.clusterManager = new ClusterManager(
            {}, //todo: client config overrides
            {
                nodes: clusterConfig
            },
            this.nodeId,
        );

        this.nodeDistributionMiddleware = new NodeDistributionMiddleware(this.clusterManager, this.nodeId);

        // queue specific stuff

        this.queueService = new QueueService(
            {
                messageMaxSendAttempts: parseInt(process.env.MAX_SEND_ATTEMPTS),
                messageBaseRetryDelay: parseInt(process.env.BASE_RETRY_DELAY_MS),
            }
        );

        this.clientController = new ClientController(
            this.queueService,
            this.rpcServer,
            this.nodeDistributionMiddleware,
        );

        await this.queueService.processMessages();
        await this.clusterManager.start();
    }
}

dotenv.config();
const server = new Application();

server.run().then(() => {
    Logger.log('Booted defiant');
}).catch((err: Error) => {
    Logger.error('defiant died', err);
    process.exit(1);
});
