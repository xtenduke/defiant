import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { GreeterClient as _client_queue_GreeterClient, GreeterDefinition as _client_queue_GreeterDefinition } from './client_queue/Greeter';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  client_queue: {
    Greeter: SubtypeConstructor<typeof grpc.Client, _client_queue_GreeterClient> & { service: _client_queue_GreeterDefinition }
    HelloReply: MessageTypeDefinition
    HelloRequest: MessageTypeDefinition
  }
}

