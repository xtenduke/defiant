import {IMembershipService, MembershipEventsCallback} from './IMembershipService';
import {Node} from '../../model/system/Node';
import Swim from 'swim';
import {NodeLeftReason} from './IMembershipService';
import {Logger} from '../../util/Logger';

export interface SwimOptions {
    local: {
        host?: string,
        meta?: [string: string]
    },
    codec?: 'msgpack',
    disseminationFactor?: number,
    interval?: number,
    joinTimeout?: number,
    pingTimeout?: number,
    pingReqTimeout?: number,
    pingReqGroupSize?: number,
    suspectTimeout?: number,
    udp?: {maxDgramSize: number},
    preferCurrentMeta?: boolean
}

export interface Update {
    meta: any,
    host: string,
    state: State,
    incarnation: number,
}

export enum State {
    Alive = 0,
    Suspect = 1,
    Faulty = 2,
}

export enum EventType {
    Change = 'change',
    Error = 'error',
    Ready = 'ready',
    Update = 'update',
}


export interface SwimMetadata {
    nodeId: string;
    nodePort: number;
    swimPort: number
}

export interface Config {
    nodeId: string;
    nodePort: number;
    swimPort: number
}

export class SwimMembershipService implements IMembershipService {
    private callback?: MembershipEventsCallback;
    private swim: any;

    public constructor(config: Config) {
        this.swim = new Swim({
            local: {
                host: `0.0.0.0:${config.swimPort}`,
                meta: {
                    nodeId: config.nodeId,
                    nodePort: config.nodePort
                }
            },
        });

        this.swim.on(EventType.Update, this.onUpdate.bind(this));
        this.swim.on(EventType.Error, this.onError.bind(this));
        this.swim.on(EventType.Ready, this.onReady.bind(this));
        this.swim.on(EventType.Change, this.onChange.bind(this));

        Logger.log(`[SwimMembershipService] started on port ${config.swimPort}`);
    }

    public onDiscoveredNodes(nodes: Node[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.swim.bootstrap(nodes.map((node) => `${node.host}:${node.port}`), (err: Error) => {
                if (err) {
                    reject(err);
                }
            });

            Logger.log('[SwimMembershipService] bootstrapped nodes', nodes);

            resolve();
        });
    }

    /**
     * Change on membership, i.e. new node or node died / left
     */
    public onChange(change: Update): void {
        Logger.log('[SwimMembershipService] onChange', change);
        const nodeData: Node = {
            nodeId: change.meta.nodeId,
            host: change.host.split(':')[0],
            port: change.meta.nodePort, // don't pass through the swim port
        };

        switch (change.state) {
        case State.Alive:
            this.callback?.onNodeAdded(nodeData);
            break;
        case State.Suspect:
            Logger.log('[SwimMembershipService] node is suspect!', nodeData);
            break;
        case State.Faulty:
            this.callback?.onNodeRemoved(nodeData, NodeLeftReason.NODE_DIED); // todo: how is this coming through?
            break;
        }
    }

    /**
     * Node recovered, or update metadata
     */
    private onUpdate(update: Update): void {
        Logger.log('[SwimMembershipService] onUpdate', update);
        // todo: handle updated metadata etc
        // are we going to force remove all suspect nodes and re-add them?
    }

    private onError(error: Error): void {
        Logger.error('[SwimMembershipService] onError', error);
    }

    private onReady(): void {
        Logger.log('[SwimMembershipService] onReady');
    }

    public setCallback(callback: MembershipEventsCallback): void {
        this.callback = callback;
    }
}
