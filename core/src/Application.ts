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
import {IMembershipService} from './service/membership/IMembershipService';
import {SwimMembershipService} from './service/membership/SwimMembershipService';
import {StaticDiscoveryService} from './service/discovery/StaticDiscoveryService';
import {Config} from './util/Config';

export interface ApplicationConfig {
    port: number;
    nodeId: string;
    cluster: boolean;
    membershipPort: number;
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
    private membershipService: IMembershipService;
    private nodeDistributionMiddleware: NodeDistributionMiddleware;

    constructor() {
        this.nodeId = randomUUID();

        this.rpcServer = new Server({
            port: Config.safeParseInt(process.env.CLIENT_RPC_PORT),
            grpcServerConfig: JSONSafe.parse(process.env.GRPC_CONNECTION_CONFIG),
        });

        this.config = {
            port: Config.safeParseInt(process.env.CLIENT_RPC_PORT),
            membershipPort: Config.safeParseInt(process.env.MEMBERSHIP_PORT),
            nodeId: this.nodeId,
            cluster: JSONSafe.parse(process.env.CLUSTER)
        };
    }

    public async run(): Promise<void> {
        Logger.log(`booting defiant, node: ${this.nodeId}`, this.config);

        await this.rpcServer.start();
        // bind controllers
        // some DI framework would be quite nice right now
        // config hack until we're containerised
        // JSONSafe should be removed when we have proper configuration loading and DI
        const clusterConfig = { nodes: JSONSafe.parse(process.env.CLUSTER_CONFIG)?.map((config: {port: number}) => {
            return {
                ...config,
                isSelf: config.port === this.config.port,
            };
        })};

        // if cluster config exists, use static cluster discovery
        if (clusterConfig && clusterConfig.nodes && clusterConfig.nodes.length > 0) {
            this.discoveryService = new StaticDiscoveryService(clusterConfig);
        } else {
            this.discoveryService = new DNSDiscoveryService({
                namespace: process.env.DNS_NAMESPACE,
                membershipPort: this.config.membershipPort,
                waitMs: Config.safeParseInt(process.env.DNS_DISCOVERY_WAIT_MS, 30000),
                maxAttempts: Config.safeParseInt(process.env.DNS_DISCOVERY_MAX_ATTEMPTS, 5),
            });
        }

        // cluster comms
        this.nodeService = new NodeService(this.nodeId);

        this.nodeController = new NodeController(
            this.nodeService,
            this.rpcServer,
        );

        this.membershipService = new SwimMembershipService({
            nodePort: this.config.port,
            nodeId: this.nodeId,
            swimPort: Config.safeParseInt(process.env.MEMBERSHIP_PORT),
            interval: Config.safeParseInt(process.env.SWIM_PING_INTERVAL_MS),
            joinTimeout: Config.safeParseInt(process.env.SWIM_JOIN_TIMEOUT_MS),
            pingTimeout: Config.safeParseInt(process.env.SWIM_PING_TIMEOUT_MS),
            pingReqTimeout: Config.safeParseInt(process.env.SWIM_PING_REQ_TIMEOUT_MS),
            suspectTimeout: Config.safeParseInt(process.env.SWIM_SUSPECT_TIMEOUT_MS),
        });

        this.clusterManager = new ClusterManager(
            {}, //todo: client config overrides
            this.nodeId,
            this.discoveryService,
            this.membershipService,
        );

        this.nodeDistributionMiddleware = new NodeDistributionMiddleware(this.clusterManager, this.nodeId);

        // queue specific stuff

        this.queueService = new QueueService({
            messageMaxSendAttempts: Config.safeParseInt(process.env.MAX_SEND_ATTEMPTS),
            messageBaseRetryDelay: Config.safeParseInt(process.env.BASE_RETRY_DELAY_MS),
        });

        this.clientController = new ClientController(
            this.queueService,
            this.rpcServer,
            this.nodeDistributionMiddleware,
        );

        await this.queueService.processMessages();
        await this.clusterManager.start();
    }

    public async healthCheck(): Promise<void> {
        const port = Config.safeParseInt(process.env.HEALTHCHECK_PORT, 8082);

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
    Logger.log('defiant up');
}).catch((err: Error) => {
    Logger.error('defiant died', err, err.stack);
    process.exit(1);
});
