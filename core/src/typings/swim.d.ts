declare module 'swim' {
    class Swim {
        constructor(opts: any);
        bootstrap(hosts: any, callback: ((err: Error) => void)): void;
        checksum(): any;
        join(hosts: any, callback: ((err: Error) => void)): any;
        leave(): void;
        localhost(): string;
        members(hasLocal: boolean, hasFaulty: boolean): any[];
        updateMeta(meta: any): any;
        whoami(): string;
        on(event: any, callback:((update: any | Error | undefined) => void)): void;
    } 

    export = Swim;
}
