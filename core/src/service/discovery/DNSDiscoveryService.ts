import {IDiscoveryService} from './IDiscoveryService';
import {Node} from '../../model/system/Node';

export class DNSDiscoveryService implements IDiscoveryService {
    public async discoverNodes(): Promise<Node[]> {
        return [];
    }
}
