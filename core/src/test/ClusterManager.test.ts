import {ClusterManager} from '../service/ClusterManager';
import {BaseRPCClientConfig} from '../client/BaseRPCClient';
import {ClusterConfig} from '../service/NodeService';
import {randomUUID} from 'crypto';
import {InterrogateResponse} from '../../proto/gen/node_router/InterrogateResponse';

const currentNodeId = '65b2d3de-b494-4b52-a16f-558467b30502';

const nodes: InterrogateResponse[] = [{
    nodeId: 'a09a4a50-cd99-417c-bff4-41f7d58a315b',
    isMaster: false,
}, {
    nodeId: 'e72e725d-bd02-4320-af69-5a99d69eb9f1',
    isMaster: false,
}, {
    nodeId: 'f3193555-99a5-483e-b0e8-d269b80ab12c',
    isMaster: false,
}];

describe('ClusterManager', () => {
    it('Does correctly partition nodeIds evenly', () => {
        const clusterManager = new ClusterManager(
            {} as BaseRPCClientConfig,
            { nodes: [] } as ClusterConfig,
            randomUUID(),
        );

        const testUuids = [
            'cef59a58-a65f-4967-8e0c-2fc82d1a21c2',
            'd011364f-4f42-4601-818b-b32ed01bc024',
            'fe2fd8ca-7459-49b6-829a-501eea018d5b',
        ];

        // @ts-ignore
        const hashRing = clusterManager.populateHashRing(nodes, currentNodeId);
        const result = testUuids.map((uuid) => hashRing.get(uuid));

        // ensure our consistent hash ring is in fact consistent...
        expect(result).toEqual([
            'e72e725d-bd02-4320-af69-5a99d69eb9f1',
            'a09a4a50-cd99-417c-bff4-41f7d58a315b',
            'a09a4a50-cd99-417c-bff4-41f7d58a315b'
        ]);
    });
});