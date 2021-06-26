import {Logger} from '../util/Logger';
import * as grpc from '@grpc/grpc-js';
import {ServiceDefinition, UntypedServiceImplementation} from '@grpc/grpc-js';
import * as Constants from '../util/Constants';

export interface RPCServerConfig {
    port: number;
    grpcServerConfig?: grpc.ChannelOptions;
}

export class Server {
    public constructor(private readonly config: RPCServerConfig) {}

    private server: grpc.Server;

    public async start(): Promise<void> {
        Logger.log('Start gRPC on port:', this.config.port);
        this.server = new grpc.Server(this.config.grpcServerConfig ?? Constants.GRPC_CONNECTION_CONFIG);

        this.server.bindAsync(
            `0.0.0.0:${this.config.port}`,
            grpc.ServerCredentials.createInsecure(),
            (err: Error | null, port: number) => {
                if (err) {
                    Logger.error('error starting server:', err.message);
                    Promise.reject(err);
                } else {
                    Logger.debug('Server bound on port', port);
                    this.server.start();
                    Promise.resolve();
                }
            });
    }

    public addService(definition: ServiceDefinition, handlers: UntypedServiceImplementation): void {
        this.server.addService(definition, handlers);
    }
}