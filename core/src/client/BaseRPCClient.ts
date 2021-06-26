import * as Constants from '../util/Constants';
import * as grpc from '@grpc/grpc-js';

export interface BaseRPCClientConfig {
    grpcConfig?: grpc.ChannelOptions;
    deadline?: number;
}

export abstract class BaseRPCClient {
    protected constructor(protected readonly config: BaseRPCClientConfig) {}

    /**
     * Default gRPC connection config
     */
    protected getGRPCConfig(): grpc.ChannelOptions {
        return this.config.grpcConfig ?? Constants.GRPC_CONNECTION_CONFIG;
    }

    /**
     * Get Deadline for gRPC requests
     * gRPC expects a specific date for a deadline, rather than a timeout
     * @param time number in ms till request should throw
     */
    protected getDeadline(time?: number): Date {
        return new Date(Date.now() + (this.config.deadline ?? time ?? 10000));
    }
}