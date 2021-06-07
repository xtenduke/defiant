import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { QueueClient as _client_queue_QueueClient, QueueDefinition as _client_queue_QueueDefinition } from './client_queue/Queue';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  client_queue: {
    AddMessageReply: MessageTypeDefinition
    AddMessageRequest: MessageTypeDefinition
    Queue: SubtypeConstructor<typeof grpc.Client, _client_queue_QueueClient> & { service: _client_queue_QueueDefinition }
  }
}

