import {Node} from '../../model/system/Node';

export interface IDiscoveryService {
    discoverNodes(): Promise<Node[]>
}