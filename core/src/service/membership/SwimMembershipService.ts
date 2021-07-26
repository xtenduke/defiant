import {IMembershipService, MembershipEventsCallback} from './IMembershipService';
import {Node} from '../../model/system/Node';
import Swim from 'swim';
import {NodeLeftReason} from './IMembershipService';
import {Logger} from '../../util/Logger';
import ip from 'ip';

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
    swimPort: number;
    interval: number;
    joinTimeout: number;
    pingTimeout: number;
    pingReqTimeout: number;
    suspectTimeout: number;
}

export class SwimMembershipService implements IMembershipService {
    private callback?: MembershipEventsCallback;
    private swim: any;
    private ip: string;

    public constructor(config: Config) {
        this.ip = ip.address();

        this.swim = new Swim({
            local: {
                host: `${this.ip}:${config.swimPort}`,
                meta: {
                    nodeId: config.nodeId,
                    nodePort: config.nodePort
                }
            },
            interval: config.interval,
            joinTimeout: config.joinTimeout,
            pingTimeout: config.pingTimeout,
            pingReqTimeout: config.pingReqTimeout,
            suspectTimeout: config.suspectTimeout,
        });

        this.swim.on(EventType.Update, this.onUpdate.bind(this));
        this.swim.on(EventType.Error, this.onError.bind(this));
        this.swim.on(EventType.Ready, this.onReady.bind(this));
        this.swim.on(EventType.Change, this.onChange.bind(this));

        Logger.log(`[SwimMembershipService] started on ${this.ip}:${config.swimPort}`);
    }

    public async onDiscoveredNodes(nodes: Node[]): Promise<void> {
        return new Promise((resolve, reject) => {
            const mappedNodes = nodes.map((node) => `${node.host}:${node.port}`);

            this.swim.bootstrap(mappedNodes, (err: Error) => {
                if (err) {
                    Logger.error('[SwimMembershipService] discovered nodes failed', err, err.stack);
                    reject(err);
                }
            });

            Logger.log('[SwimMembershipService] bootstrapped nodes', mappedNodes);

            resolve();
        });
    }

    /**
     * Change on membership, i.e. new node or node died / left
     */
    public onChange(change: Update): void {
        const nodeData: Node = {
            nodeId: change.meta.nodeId,
            host: change.host.split(':')[0],
            port: change.meta.nodePort, // don't pass through the swim port
        };

        switch (change.state) {
        case State.Alive:
            Logger.log('[SwimMembershipService] onChange - new node', change.host);
            this.callback?.onNodeAdded(nodeData);
            break;
        case State.Suspect:
            Logger.log('[SwimMembershipService] node is suspect!', change.host);
            break;
        case State.Faulty:
            Logger.log('[SwimMembershipService] onChange - node faulty', change.host);
            this.callback?.onNodeRemoved(nodeData, NodeLeftReason.NODE_DIED); // todo: how is this coming through?
            break;
        default:
            Logger.log('[SwimMembershipService] onChange - unknown', change);
            break;
        }
    }

    /**
     * Node recovered, or update metadata
     */
    private onUpdate(update: Update): void {
        const nodeData: Node = {
            nodeId: update.meta.nodeId,
            host: update.host.split(':')[0],
            port: update.meta.nodePort, // don't pass through the swim port
        };

        this.callback?.onNodeUpdate(nodeData);

        switch (update.state) {
        case State.Alive:
            Logger.log('[SwimMembershipService] onUpdate - node update', update.host);
            // todo: disabled - this.callback?.onNodeUpdate(nodeData);
            break;
        case State.Suspect:
            Logger.log('[SwimMembershipService] onUpdate - node is suspect!', update.host);
            break;
        case State.Faulty:
            Logger.log('[SwimMembershipService] onUpdate - node leaving', update.host);
            // todo: disabled - this.callback?.onNodeRemoved(nodeData, NodeLeftReason.NODE_LEFT);
            break;
        default:
            Logger.log('[SwimMembershipService] onUpdate... unknown', update);
            break;
        }
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
