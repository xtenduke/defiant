declare module 'swim' {
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
        state: Swim.State,
        incarnation: number,
    }

    export class Swim {
        constructor(opts: SwimOptions);
        bootstrap(hosts: any, callback: ((err: Error) => void)): void;
        checksum(): any;
        join(hosts: any, callback: ((err: Error) => void)): any;
        leave(): void;
        localhost(): string;
        members(hasLocal: boolean, hasFaulty: boolean): any[];
        updateMeta(meta: any): any;
        whoami(): string;
        on(event: Swim.EventType, callback:((update: Update | Error | undefined) => void)): void;

        static Default: {
            joinCheckInterval: number;
            joinTimeout: number;
        };
    }

    export namespace Swim {
        export enum EventType {
            Change = 'change',
            Error = 'error',
            Ready = 'ready',
            Update = 'update',
        }

        export enum State {
            Alive = 0,
            Suspect = 1,
            Faulty = 2,
        }
    }
}

