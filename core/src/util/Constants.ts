export const GRPC_CONNECTION_CONFIG = {
    'grpc.keepalive_time_ms': 30000, // must be less than max total backoff
    'grpc.keepalive_timeout_ms': 5000, // time to wait for pong
    'grpc.keepalive_permit_without_calls': 1, // send keepalive even if there are no actual calls
    'grpc.http2.max_pings_without_data': 0,
}