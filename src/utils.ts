
export function sleep(timeMs: number) {
    return new Promise(resolve => setTimeout(resolve, timeMs));
}


export function listExcept<T>(list: T[], except: T[]): T[] {
    const out: T[] = [];
    for (const entry of list) {
        if ( !except.includes(entry) ) {
            out.push(entry);
        }
    }
    return out;
}


export function permutations<T>(data: T[][]): T[][] {
    if (data.length === 1) return data[0].map(v => [v]);

    const perms: T[][] = [];
    const firstGroup = data[0];
    const subPerms = permutations(data.slice(1));
    for (const entry of firstGroup) {
        for (const subPerm of subPerms) {
            perms.push([entry, ...subPerm]);
        }
    }

    return perms;
}