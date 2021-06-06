// Original file: proto/route_client_queue.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { HelloReply as _client_queue_HelloReply, HelloReply__Output as _client_queue_HelloReply__Output } from '../client_queue/HelloReply';
import type { HelloRequest as _client_queue_HelloRequest, HelloRequest__Output as _client_queue_HelloRequest__Output } from '../client_queue/HelloRequest';

export interface GreeterClient extends grpc.Client {
  SayHello(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHello(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHello(argument: _client_queue_HelloRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHello(argument: _client_queue_HelloRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHello(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHello(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHello(argument: _client_queue_HelloRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHello(argument: _client_queue_HelloRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  
  SayHelloAgain(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHelloAgain(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHelloAgain(argument: _client_queue_HelloRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  SayHelloAgain(argument: _client_queue_HelloRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHelloAgain(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHelloAgain(argument: _client_queue_HelloRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHelloAgain(argument: _client_queue_HelloRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  sayHelloAgain(argument: _client_queue_HelloRequest, callback: (error?: grpc.ServiceError, result?: _client_queue_HelloReply__Output) => void): grpc.ClientUnaryCall;
  
}

export interface GreeterHandlers extends grpc.UntypedServiceImplementation {
  SayHello: grpc.handleUnaryCall<_client_queue_HelloRequest__Output, _client_queue_HelloReply>;
  
  SayHelloAgain: grpc.handleUnaryCall<_client_queue_HelloRequest__Output, _client_queue_HelloReply>;
  
}

export interface GreeterDefinition extends grpc.ServiceDefinition {
  SayHello: MethodDefinition<_client_queue_HelloRequest, _client_queue_HelloReply, _client_queue_HelloRequest__Output, _client_queue_HelloReply__Output>
  SayHelloAgain: MethodDefinition<_client_queue_HelloRequest, _client_queue_HelloReply, _client_queue_HelloRequest__Output, _client_queue_HelloReply__Output>
}
