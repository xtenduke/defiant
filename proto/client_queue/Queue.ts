// Original file: proto/route_client_queue.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AddMessageReply as _client_queue_AddMessageReply, AddMessageReply__Output as _client_queue_AddMessageReply__Output } from '../client_queue/AddMessageReply';
import type { AddMessageRequest as _client_queue_AddMessageRequest, AddMessageRequest__Output as _client_queue_AddMessageRequest__Output } from '../client_queue/AddMessageRequest';

export interface QueueClient extends grpc.Client {
  AddMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageReply__Output) => void): grpc.ClientUnaryCall;
  
}

export interface QueueHandlers extends grpc.UntypedServiceImplementation {
  AddMessage: grpc.handleUnaryCall<_client_queue_AddMessageRequest__Output, _client_queue_AddMessageReply>;
  
}

export interface QueueDefinition extends grpc.ServiceDefinition {
  AddMessage: MethodDefinition<_client_queue_AddMessageRequest, _client_queue_AddMessageReply, _client_queue_AddMessageRequest__Output, _client_queue_AddMessageReply__Output>
}
