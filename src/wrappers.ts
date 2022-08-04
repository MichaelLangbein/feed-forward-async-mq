import { Wps, Database, MessageBus, KvPair, WpsOptionInput } from './infra';
import { Post, getProvidedProductNames, getParaFromPost } from './post';
import { listExcept, permutations, Queue } from './utils';
import hash from 'object-hash';


export class Wrapper {

    protected parameterComboQueue = new Queue<{post: Post, paraCombo: KvPair[]}>(30);
    protected incompleteParameterCombos: {[processId: number]: KvPair[]} = {};

    constructor(protected name: string, protected db: Database, protected mb: MessageBus, protected wps: Wps) {
        this.init();
    }

    protected init() {

        const loop = () => {
            const entry = this.parameterComboQueue.dequeue();
            if (entry) {
                const {post, paraCombo} = entry;

                // querying cache
                const cacheKey = hash(paraCombo);
                const cachedResponse = this.db.get(cacheKey);
                // lock that prevents two identical requests, fired very close to each other, to start the process twice
                if (cachedResponse === "running") {
                    // putting request back in queue so we don't loose any branches.
                    this.parameterComboQueue.enqueue({ post, paraCombo });
                } else if (cachedResponse) {
                    const newPost: Post = {
                        processId: post.processId,
                        stepNumber: post.stepNumber + 1,
                        lastProcessor: this.name,
                        data: { ...post.data }
                    };
                    newPost.data[this.name] = cachedResponse;
                    this.mb.write('posts', newPost);
                } else {
                    // lock that prevents two identical requests, fired very close to each other, to start the process twice
                    this.db.set(cacheKey, "running");

                    // running wps
                    this.wps.execute(paraCombo).then((products) => {
                        const newPost: Post = {
                            processId: post.processId,
                            stepNumber: post.stepNumber + 1,
                            lastProcessor: this.name,
                            data: { ...post.data }
                        };
                        for (const product of products) {
                            if (!newPost.data[this.name]) newPost.data[this.name] = {};
                            newPost.data[this.name][product.name] = product.value;
                        }
                        // writing to queue
                        this.mb.write('posts', newPost);


                        // setting cache
                        this.db.set(cacheKey, newPost.data[this.name]);
                    });
                }
            }
            setTimeout(loop, 10);
        };
        
        
        this.mb.subscribe('posts', async post => {
            const parameterCombinations = this.validParameterCombinations(post);
            for (const parameterCombination of parameterCombinations) {
                this.parameterComboQueue.enqueue({ post: post, paraCombo: parameterCombination });
            }
        });


        loop();
    }


    protected validParameterCombinations(post: Post): KvPair[][] {

        // 1: if the post already contains outputs from this service, return []
        if (post.data[this.name]) return [];


        const requiredInputs  = this.getRequiredInputNames();
        let givenInputs       = getProvidedProductNames(post);
        let missingInputs     = listExcept(requiredInputs, givenInputs);
        let givenInputValues  = givenInputs.map(pName => getParaFromPost(pName, post));
        
        // 2: if the post doesn't contain a required input ...
        if (missingInputs.length > 0) {
            // 2.1: ... see if you can fill the missing inputs from past `incompleteParameterCombos` ... 
            if (this.incompleteParameterCombos[post.processId]) {
                const pastParaValues = this.incompleteParameterCombos[post.processId];
                givenInputValues.push(...pastParaValues);
                givenInputs = givenInputValues.map(kv => kv.name);
                missingInputs = listExcept(requiredInputs, givenInputs);
            }
        }
        // 2.2: If that still doesn't work, store incomplete para-combo for later use (in 2.1) and return []
        if (missingInputs.length > 0) {
            this.incompleteParameterCombos[post.processId] = givenInputValues;
            return [];
        } else {
            delete(this.incompleteParameterCombos[post.processId]);
        }


        // 3: if the post doesn't contain a config-parameter of this service, run with all possible values of that config-parameter.
        const configurableInputs                    = this.getConfigurableInputNames();
        const unspecifiedConfigs                    = listExcept(configurableInputs, givenInputs);
        const specifiedConfigs                      = listExcept(configurableInputs, unspecifiedConfigs);
        const givenConfigParaValues: KvPair[][]     = specifiedConfigs.map(cName => [getParaFromPost(cName, post)]);
        const givenNonConfigParaValues: KvPair[][]  = givenInputValues.map(kv => [kv]);
        const unspecifiedConfigValues: KvPair[][]   = unspecifiedConfigs.map(pName => this.getAllPossibleValues(pName));

        const allParas: KvPair[][] = [...givenNonConfigParaValues, ...givenConfigParaValues, ...unspecifiedConfigValues];
        const paraPerms = permutations(allParas);
        return paraPerms;
    }

    private getRequiredInputNames(): string[] {
        const names: string[] = [];
        for (const input of this.wps.inputs) {
            if (!Object.keys(input).includes('options')) {
                names.push(input.name);
            }
        }
        return names;
    }

    private getConfigurableInputNames(): string[] {
        const names: string[] = [];
        for (const input of this.wps.inputs) {
            if (Object.keys(input).includes('options')) {
                names.push(input.name);
            }
        }
        return names;
    }

    private getAllPossibleValues(paraName: string): KvPair[] {
        const para: WpsOptionInput = this.wps.inputs.find(i => i.name === paraName) as WpsOptionInput;
        const allPossibleValues = para.options.map(o => ({ name: paraName, value: o }));
        return allPossibleValues;
    }
}


export class ModelpropWrapper extends Wrapper { }

export class ShakygroundWrapper extends Wrapper { }

export class AssetMasterWrapper extends Wrapper { }

export class DeusWrapper extends Wrapper { }




