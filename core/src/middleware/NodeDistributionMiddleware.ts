import {RequestMetadata} from '../../proto/gen/client_queue/RequestMetadata';
import {ResponseMetadata} from '../../proto/gen/client_queue/ResponseMetadata';
import {Code} from '../../proto/gen/client_queue/Code';
import {ClusterManager} from '../service/ClusterManager';

export class NodeDistributionMiddleware {
    public constructor(private readonly clusterManager: ClusterManager, private readonly currentNodeId: string) {}

    /**
     * Check if this is the correct node,
     * else issue a redirection notice
     * @param request - the request metadata
     */
    public checkNode(request: RequestMetadata): ResponseMetadata | undefined {
        const destination = this.clusterManager.getDestination(request.queueId);
        if (destination.nodeId !== this.currentNodeId) {
            return {
                code: Code.REDIRECT,
                redirect: {
                    host: destination.host,
                    port: destination.port
                },
                message: 'node redirect'
            };
        } else {
            return undefined;
        }
    }
}