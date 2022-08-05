import { Wps, Database, MessageBus, KvPair, WpsOptionInput } from './infra';
import { Post, getProvidedProductNames, getParaFromPost } from './post';
import { listExcept, permutations, Queue } from './utils';
import hash from 'object-hash';





export class Wrapper {

    protected parameterComboQueue = new Queue<{processId: number, irrelevantParameters: KvPair[], relevantParameters: KvPair[]}>(30);
    protected incompleteParameterCombos: {[processId: number]: KvPair[]} = {};

    constructor(protected name: string, protected db: Database<KvPair[]>, protected mb: MessageBus, protected wps: Wps) {
        this.init();
    }

    protected init() {

        const loop = () => {
            const entry = this.parameterComboQueue.dequeue();
            if (entry) {
                const {processId, irrelevantParameters, relevantParameters} = entry;

                // querying cache
                const cacheKey = hash(relevantParameters);
                const cachedResponse = this.db.get(cacheKey);
                if (cachedResponse) {
                    const newPost: Post = {
                        processId: processId,
                        data: [...irrelevantParameters, ...cachedResponse]
                    };
                    this.mb.write('posts', newPost);
                } else {
                    // running wps
                    this.wps.execute(relevantParameters).then((products) => {
                        const newPost: Post = {
                            processId: processId,
                            data: [... irrelevantParameters, ...products]
                        };
                        // writing to queue
                        this.mb.write('posts', newPost);

                        // setting cache
                        this.db.set(cacheKey, products);

                        // repeat
                        loop();
                    });
                }
            } else {
                setTimeout(loop, 100);
            }
        };
        
        
        this.mb.subscribe('posts', async (post: Post) => {
            const parameters = post.data;
            const irrelevantParameters = this.getIrrelevantParameters(parameters);
            const relevantParameters = this.getRelevantParameters(parameters);
            const parameterCombinations = this.validParameterCombinations(relevantParameters);
            for (const parameterCombination of parameterCombinations) {
                this.parameterComboQueue.enqueue({ processId: post.processId, irrelevantParameters, relevantParameters: parameterCombination });
            }
        });


        loop();
    }


    protected validParameterCombinations(post: Post): KvPair[][] {
        // 1: if the post already contains outputs from this service, return []
        // 2. add given parameter to all combos that are already present
        // any one of them that is now complete may be enqueued.
    }

}


export class ModelpropWrapper extends Wrapper { }

export class ShakygroundWrapper extends Wrapper { }

export class AssetMasterWrapper extends Wrapper { }

export class DeusWrapper extends Wrapper { }




