import {IMembershipService, MembershipEventsCallback} from './IMembershipService';
import {Node} from '../../model/system/Node';
import {Swim, SwimOptions, Update} from 'swim';
import {NodeLeftReason} from './IMembershipService';
import {Logger} from '../../util/Logger';

export interface SwimMetadata {
    nodeId: string;
    nodePort: number;
}

export class SwimMembershipService implements IMembershipService {
    private callback?: MembershipEventsCallback;
    private swim: Swim;

    public constructor(metaData: SwimMetadata) {
        this.swim = new Swim({} as SwimOptions);
        this.swim.updateMeta(metaData);

        this.swim.on(Swim.EventType.Update, this.onUpdate.bind(this));
        this.swim.on(Swim.EventType.Error, this.onError.bind(this));
        this.swim.on(Swim.EventType.Ready, this.onReady.bind(this));
        this.swim.on(Swim.EventType.Change, this.onChange.bind(this));
    }

    public onDiscoveredNodes(nodes: Node[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.swim.bootstrap(nodes.map((node) => `${node.host}:${node.port}`), ((err: Error) => {
                if (err) {
                  reject(err);
                }
            }));

            resolve();
        });
    }

    /**
     * Change on membership, i.e. new node or node died / left
     */
    public onChange(change: Update) {
        Logger.log('[SwimMembershipService] onChange', change);
        const nodeData: Node = {
            nodeId: change.meta.nodeId,
            host: change.host.split(':')[0],
            port: change.meta.nodePort, // don't pass through the swim port
        }

        switch (change.state) {
            case Swim.State.Alive:
                this.callback?.onNodeAdded(nodeData);
            break;
            case Swim.State.Suspect:
                Logger.log('[SwimMembershipService] node is suspect!', nodeData);
            case Swim.State.Faulty:
                this.callback?.onNodeRemoved(nodeData, NodeLeftReason.NODE_DIED); // todo: how is this coming through?
            break;
        }
    }

    /**
     * Node recovered, or update metadata
     */
    public onUpdate(update: Update) {
        Logger.log('[SwimMembershipService] onUpdate', update);
        // todo: handle updated metadata etc
        // are we going to force remove all suspect nodes and re-add them?
    }

    public onError(error: Error) {
        Logger.error('[SwimMembershipService] onError', error);
    }

    public onReady() {
        Logger.log('[SwimMembershipService] onReady');
    }

    public setCallback(callback: MembershipEventsCallback) {
        this.callback = callback;
    }
}
