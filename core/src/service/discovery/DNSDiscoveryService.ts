import {IDiscoveryService} from './IDiscoveryService';
import {Node} from '../../model/system/Node';
import * as dns from 'dns';
import {Logger} from '../../util/Logger';

export interface Config {
    namespace: string;
}

export class DNSDiscoveryService implements IDiscoveryService {
    public constructor(private config: Config) {}

    public async discoverNodes(attempt = 0): Promise<Node[]> {

        try {
            return await this.discover();
        } catch {
            return this.discoverNodes(attempt + 1);
        }
    }

    private async discover(): Promise<Node[]> {
        Logger.log(`[DNSDiscoveryService] discovering on ${this.config.namespace}`);

        await DNSDiscoveryService.sleep(30000);
        return new Promise((resolve, reject) => {
            dns.resolve4(this.config.namespace, (err, addresses) => {
                if (err) {
                    Logger.error('DNS lookup error', err);
                    reject(err);
                } else {
                    Logger.log('DNS lookup found', addresses);
                    const nodes: Node[] = addresses.map((address: string) => {
                        return {
                            host: address,
                            port: 8080 // TODO: why am I still hardcoded?..
                        };
                    });

                    resolve(nodes);
                }
            });

        });
    }

    private static async sleep(time: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, time);
        })
    }
}
