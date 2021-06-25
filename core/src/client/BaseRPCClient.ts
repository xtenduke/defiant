export abstract class BaseRPCClient<T, U> {

    // protected abstract getService(): SubtypeConstructor<typeof grpc.Client, NodeClient> & { service: NodeDefinition };
    //
    // protected abstract getHost(): NodeDefinition;
    //
    // public async connect(): Promise<void> {
    //     const host = this.getHost();
    //     const target = `${host.host}:${host.port}`;
    //     //const client = new No --- hmm instance type class? could use tokenization
    // }
    //
    // // const packageDefinition = protoLoader.loadSync(
    // //     path.join(__dirname, '../../proto/route_client_queue.proto'),
    // //     {keepCase: true,
    // //         longs: String,
    // //         enums: String,
    // //         defaults: true,
    // //         oneofs: true
    // //     })
    // //
    // // const client_queue_proto = grpc.loadPackageDefinition(packageDefinition).client_queue as any;
    // // const target = 'localhost:8080';
    // // const client = new client_queue_proto.Queue(target,
    // //     grpc.credentials.createInsecure(), {
    // //         'grpc.keepalive_time_ms': 30000, // must be less than max total backoff
    // //         'grpc.keepalive_timeout_ms': 5000, // time to wait for pong
    // //         'grpc.keepalive_permit_without_calls': 1, // send keepalive even if there are no actual calls
    // //         'grpc.http2.max_pings_without_data': 0
    // //     }
    // // );

}