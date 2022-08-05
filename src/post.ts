import { KvPair } from './infra';


export interface Post {
    processId: number,
    lastProcessor: string;
    data: KvPair[]
}
