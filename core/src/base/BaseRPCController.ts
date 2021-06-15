import {ServiceDefinition, UntypedServiceImplementation} from '@grpc/grpc-js';
import {Server} from '../controller/Server';

export abstract class BaseRPCController<T extends UntypedServiceImplementation> {
    protected constructor(
        protected readonly server: Server
    ) {
        server.addService(this.getService(), this.getHandlers());
    }

    protected abstract getService(): ServiceDefinition<T>;
    protected abstract getHandlers(): T;
}