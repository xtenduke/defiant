import {ClientController} from './controller/ClientController';
import {Logger} from './util/Logger';
import dotenv from 'dotenv';
import {Server} from './controller/Server';

export class Application {
    private readonly rpcServer: Server;
    private clientController: ClientController;

    constructor() {
        this.rpcServer = new Server({
            port: parseInt(process.env.CLIENT_RPC_PORT),
            grpcServerConfig: JSON.parse(process.env.GRPC_SERVER_CONFIG),
        });
    }

    public async run(): Promise<void> {
        await this.rpcServer.start();
        // bind controllers
        this.clientController = new ClientController(
            {
                messageMaxSendAttempts: parseInt(process.env.MAX_SEND_ATTEMPTS),
                messageBaseRetryDelay: parseInt(process.env.BASE_RETRY_DELAY_MS),
            },
            this.rpcServer,
        );

        await this.clientController.processMessages();
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
