import {IMembershipService, MembershipEventsCallback} from './IMembershipService';
import {Node} from '../../model/system/Node';

export class SwimMembershipService implements IMembershipService {
    private callback?: MembershipEventsCallback;

    public constructor() {}


    public onDiscoveredNodes(nodes: Node[]): void {
        for (let node of nodes) {
            this.callback?.onNodeAdded({
                host: node.host,
                port: node.port, // testing out this interface, application port will have to come through the metadata
                nodeId: node.nodeId,
            });
        }
    }

    public setCallback(callback: MembershipEventsCallback) {
        this.callback = callback;
    }
}
