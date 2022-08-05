import { KvPair } from './infra';


export interface Post {
    processId: number,
    data: KvPair[]
}
