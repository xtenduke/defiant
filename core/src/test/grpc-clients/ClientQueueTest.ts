import * as grpc from '@grpc/grpc-js';
import * as protoLoader from'@grpc/proto-loader';
import * as path from 'path';

let addedMessages = 0;
let receivedMessages = 0;
let confirmedMessages = 0;

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
    grpc.credentials.createInsecure(), {
        'grpc.keepalive_time_ms': 30000, // must be less than max total backoff
        'grpc.keepalive_timeout_ms': 5000, // time to wait for pong
        'grpc.keepalive_permit_without_calls': 1, // send keepalive even if there are no actual calls
        'grpc.http2.max_pings_without_data': 0
    }
);

const addMessageRequest = {
    queueId: 'beans',
    data: 'heyit\'sjustsomeutf8stringwhatareyougoingtodoaboutit',
}

const listenMessageRequest = {
    queueId: addMessageRequest.queueId,
}


client.listenForMessages(listenMessageRequest).on('data', (response) => {
    if (response) {
        receivedMessages += 1;
        logStatistics();

        const confirmMessageRequest = {
            queueId: listenMessageRequest.queueId,
            messageId: response.id,
        };

        client.confirmMessage(
            confirmMessageRequest,
            { deadline: getDeadline() },
            (error, response) => {
                if (error) {
                    console.error('Confirming message failed', error);
                } else if(response && response.success) {
                    confirmedMessages += 1;
                    logStatistics();
                } else {
                    console.log('Got error message confirming message' + JSON.stringify(response));
                }
            });
    }
});


for (let i = 0; i < 2000; i ++) {
    client.addMessage(addMessageRequest, { deadline: getDeadline() },  function(err, response) {
        if (err) {
            console.error('Caught error on addmessage handler', err);
            return;
        }

        logStatistics();
        addedMessages += 1;
    });
}

function getDeadline(time = 10000) {
    return new Date(Date.now() + time);
}

function logStatistics() {
    console.log(`Added: ${addedMessages} - Received ${receivedMessages} - Confirmed ${confirmedMessages}`);
}