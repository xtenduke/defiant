import * as grpc from '@grpc/grpc-js';
import * as protoLoader from'@grpc/proto-loader';
import * as path from 'path';

const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, '../../../proto/route_client_queue.proto'),
    {keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

const client_queue_proto = grpc.loadPackageDefinition(packageDefinition).client_queue as any;
const target = 'localhost:8080';
const client = new client_queue_proto.Queue(target,
    grpc.credentials.createInsecure());

const request = {
    data: 'heyit\'sjustsomeutf8stringwhatareyougoingtodoaboutit',
}

client.addMessage(request, function(err, response) {
    if (err) {
        console.error('Caught error on addmessage handler', err);
        return;
    }

    console.log('Added a message ' + JSON.stringify(response));
});