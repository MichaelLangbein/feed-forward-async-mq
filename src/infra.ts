import { sleep } from './utils';


export type Subscription = (data: any) => void;

export class MessageBus {
    private channels: {[channel: string]: Subscription[]} = {};

    constructor() {}

    public write<T>(channel: string, message: T) {
        if (!this.channels[channel]) this.channels[channel] = [];
        for (const subscription of this.channels[channel]) {
            subscription(message);
        }
    }

    public subscribe(channel: string, subscription: Subscription): void {
        if (!this.channels[channel]) this.channels[channel] = [];
        this.channels[channel].push(subscription);
    }
}

export type DbPredicate = (key: string, data: any) => boolean;

export class Database {
    private data: {[key: string]: any} = {};

    public set(key: string, data: any) {
        this.data[key] = data;
    }

    public get(key: string) {
        return this.data[key];
    }

    public getWhere(predicate: DbPredicate) {
        const matches: {key: string, data: any}[] = [];
        for (const key in this.data) {
            if (predicate(key, this.data[key])) {
                matches.push({key: key, data: this.data[key]});
            }
        }
        return matches;
    }
}





export interface KvPair {
    name: string,
    value: any
}


export interface WpsOptionInput {
    name: string,
    options: string[]
}

export interface WpsValueInput {
    name: string
}

export type WpsInput = WpsOptionInput | WpsValueInput;

export interface Wps {
    inputs: WpsInput[];
    execute(args: KvPair[]): Promise<KvPair[]>;
}

export class DummyWps implements Wps {
    inputs = [];

    async execute(args: KvPair[]): Promise<KvPair[]> {
        await sleep(1000);
        return [{
            name: 'dummyResponse',
            value: "wps executed."
        }];
    }
}
