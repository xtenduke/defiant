import express, { Express } from "express";
import {RPCServer} from "./RPCServer";
import {Logger} from "./util/Logger";

export class Server {
    private readonly express: Express;
    private readonly rpcServer: RPCServer;

    constructor() {
        this.express = express();
        this.rpcServer = new RPCServer(8080);
    }

    public async run() {
        this.registerRoutes(this.express)
        await this.startRPCServer();
    }

    private registerRoutes(express: Express) {
        express.get('/', (_, response) => {
            response.send('Hello world');
        });
    }

    private async startRPCServer() {
        await this.rpcServer.startServer();
    }

    /**
     * Architecture overview
     * Master node:
     *  - Handles connection routing, divide up queues to nodes based on hash?
     *  - Should be built in a way that it can be clustered
     *  - Should support failover
     *  - Should maintain a table of active nodes, and transfer to children for failover
     *
     *
     *
     */


    /**
     * Gonna need a loadbalancer aren't I
     * or 'master' server
     *
     *
     * Basic Client functionality
     *
     * Create queue
     * - PUT /queue
     *   - name: queue name
     *
     * Get Queue poll information (for websocket)
     * -- These should probably be gRPC
     * Client to get which address to listen to websocket on
     * - GET /queue/poll/<name>
     *
     *
     *
     * Cluster functionality
     * For nodes to advertise to the master server
     * TODO: later
     *
     */
}

const server = new Server();

server.run().then(() => {
    Logger.log('Booted defiant');
}).catch((err: Error) => {
    Logger.error('defiant died', err);
    process.exit(1);
})
