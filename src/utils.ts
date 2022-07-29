
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


export class Queue<T> {
    private data: (T | null)[];
    private head = 0;
    private tail = 0;

    constructor(capacity: number) {
        this.data = Array(capacity).fill(0).map(v => null);
    }

    public enqueue(val: T): boolean {
        const location = this.tail;
        if (!this.data[location]) {
            this.data[location] = val;
            this.tail = this.shiftUp(this.tail);
            return true;
        } else {
            return false;
        }
    }

    public dequeue() {
        const location = this.head;
        const data = this.data[location];
        this.data[location] = null;
        this.head = this.shiftUp(location);
        return data;
    }

    private shiftUp(n: number) {
        return (n + 1) % this.data.length;
    }
}
