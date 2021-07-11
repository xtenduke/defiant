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
import {IDiscoveryService} from './service/discovery/IDiscoveryService';
import {DNSDiscoveryService} from './service/discovery/DNSDiscoveryService';
import express from 'express';

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
    private discoveryService: IDiscoveryService;
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
        // const clusterConfig = JSONSafe.parse(process.env.CLUSTER_CONFIG).map((config: {port: number}) => {
        //     return {
        //         ...config,
        //         isSelf: config.port === this.config.port,
        //     };
        // });

        // cluster comms
        this.nodeService = new NodeService(this.nodeId);

        this.nodeController = new NodeController(
            this.nodeService,
            this.rpcServer,
        );

        this.discoveryService = new DNSDiscoveryService();

        this.clusterManager = new ClusterManager(
            {}, //todo: client config overrides
            this.nodeId,
            this.discoveryService,
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

    public async healthCheck(): Promise<void> {
        let port = parseInt(process.env.HEALTHCHECK_PORT);
        if (isNaN(port)) {
            port = 80;
        }


        const http = express();
        http.get('/', (_, res) => {
            res.send('Ok');
        });

        http.listen(port, () => {
            Logger.log(`Health check on port ${port}`);
        });
    }
}

dotenv.config();
const server = new Application();

server.healthCheck().catch((err: Error) => {
    Logger.error('Caught express error', err);
});

server.run().then(() => {
    Logger.log('Booted defiant');
}).catch((err: Error) => {
    Logger.error('defiant died', err);
    process.exit(1);
});
