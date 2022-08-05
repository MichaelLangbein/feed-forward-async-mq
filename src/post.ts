import { KvPair } from './infra';


export interface Post {
    processId: number,
    lastProcessor: string;
    data: KvPair[]
}

export function getProvidedProductNames(post: Post): string[] {
    const names: string[] = [];
    for (const service in post.data) {
        for (const product in post.data[service]) {
            names.push(product);
        }
    }
    return names;
}

export function getParaFromPost(paraName: string, post: Post): KvPair {
    for (const process in post.data) {
        // @ts-ignore
        for (const para in post.data[process]) {
            // @ts-ignore
            if (para === paraName) return { name: paraName, value: post.data[process][para] };
        }
    }
    throw new Error(`No such parameter in post: ${paraName}`);
}

