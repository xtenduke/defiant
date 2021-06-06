import express, { Express } from "express";


export class Server {
    private express: Express;

    constructor() {
        this.express = express();
        this.registerRoutes(this.express);
    }

    private registerRoutes(express: Express) {
        express.get('/', (_, response) => {
            response.send('Hello world');
        });
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
