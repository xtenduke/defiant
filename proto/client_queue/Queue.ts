// Original file: proto/route_client_queue.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { AddMessageRequest as _client_queue_AddMessageRequest, AddMessageRequest__Output as _client_queue_AddMessageRequest__Output } from '../client_queue/AddMessageRequest';
import type { AddMessageResponse as _client_queue_AddMessageResponse, AddMessageResponse__Output as _client_queue_AddMessageResponse__Output } from '../client_queue/AddMessageResponse';
import type { ConfirmMessageRequest as _client_queue_ConfirmMessageRequest, ConfirmMessageRequest__Output as _client_queue_ConfirmMessageRequest__Output } from '../client_queue/ConfirmMessageRequest';
import type { ConfirmMessageResponse as _client_queue_ConfirmMessageResponse, ConfirmMessageResponse__Output as _client_queue_ConfirmMessageResponse__Output } from '../client_queue/ConfirmMessageResponse';
import type { UnicastMessage as _client_queue_UnicastMessage, UnicastMessage__Output as _client_queue_UnicastMessage__Output } from '../client_queue/UnicastMessage';
import type { UnicastMessageRequest as _client_queue_UnicastMessageRequest, UnicastMessageRequest__Output as _client_queue_UnicastMessageRequest__Output } from '../client_queue/UnicastMessageRequest';

export interface QueueClient extends grpc.Client {
  AddMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  AddMessage(argument: _client_queue_AddMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  addMessage(argument: _client_queue_AddMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_AddMessageResponse__Output) => void): grpc.ClientUnaryCall;
  
  ConfirmMessage(argument: _client_queue_ConfirmMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  ConfirmMessage(argument: _client_queue_ConfirmMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  ConfirmMessage(argument: _client_queue_ConfirmMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  ConfirmMessage(argument: _client_queue_ConfirmMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  confirmMessage(argument: _client_queue_ConfirmMessageRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  confirmMessage(argument: _client_queue_ConfirmMessageRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  confirmMessage(argument: _client_queue_ConfirmMessageRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  confirmMessage(argument: _client_queue_ConfirmMessageRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_ConfirmMessageResponse__Output) => void): grpc.ClientUnaryCall;
  
  ListenForMessages(argument: _client_queue_UnicastMessageRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_client_queue_UnicastMessage__Output>;
  ListenForMessages(argument: _client_queue_UnicastMessageRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_client_queue_UnicastMessage__Output>;
  listenForMessages(argument: _client_queue_UnicastMessageRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_client_queue_UnicastMessage__Output>;
  listenForMessages(argument: _client_queue_UnicastMessageRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_client_queue_UnicastMessage__Output>;
  
}

export interface QueueHandlers extends grpc.UntypedServiceImplementation {
  AddMessage: grpc.handleUnaryCall<_client_queue_AddMessageRequest__Output, _client_queue_AddMessageResponse>;
  
  ConfirmMessage: grpc.handleUnaryCall<_client_queue_ConfirmMessageRequest__Output, _client_queue_ConfirmMessageResponse>;
  
  ListenForMessages: grpc.handleServerStreamingCall<_client_queue_UnicastMessageRequest__Output, _client_queue_UnicastMessage>;
  
}

export interface QueueDefinition extends grpc.ServiceDefinition {
  AddMessage: MethodDefinition<_client_queue_AddMessageRequest, _client_queue_AddMessageResponse, _client_queue_AddMessageRequest__Output, _client_queue_AddMessageResponse__Output>
  ConfirmMessage: MethodDefinition<_client_queue_ConfirmMessageRequest, _client_queue_ConfirmMessageResponse, _client_queue_ConfirmMessageRequest__Output, _client_queue_ConfirmMessageResponse__Output>
  ListenForMessages: MethodDefinition<_client_queue_UnicastMessageRequest, _client_queue_UnicastMessage, _client_queue_UnicastMessageRequest__Output, _client_queue_UnicastMessage__Output>
}
