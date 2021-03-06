import {Node} from '../../model/system/Node';

export enum NodeLeftReason {
    NODE_DIED = 0,
    NODE_LEFT = 1,
}

export interface NodeAdvertiseData extends Node {};

export interface MembershipEventsCallback {
    onNodeAdded(node: NodeAdvertiseData): void;
    onNodeRemoved(node: NodeAdvertiseData, reason: NodeLeftReason): void;
    onNodeUpdate(node: NodeAdvertiseData): void;
}

export interface IMembershipService {
    onDiscoveredNodes(nodes: Node[]): Promise<void>;
    setCallback(callback: MembershipEventsCallback): void;
}
