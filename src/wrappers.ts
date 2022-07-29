import { Wps, Database, MessageBus, KvPair, WpsOptionInput } from './infra';
import { Post, getProvidedProductNames, getParaFromPost } from './post';
import { listExcept, permutations } from './utils';
import hash from 'object-hash';


export class Wrapper {

    constructor(protected name: string, protected db: Database, protected mb: MessageBus, protected wps: Wps) {
        this.init();
    }

    protected init() {
        this.mb.subscribe('posts', async post => {
            const parameterCombinations = this.validParameterCombinations(post);
            for (const parameterCombination of parameterCombinations) {

                // querying cache
                const cacheKey = hash(parameterCombination);
                const cachedResponse = this.db.get(cacheKey);
                if (cachedResponse === "running") {
                    // lock that prevents two identical requests, fired very close to each other, to start the process twice
                    setTimeout(() => this.mb.write('posts', post), 1000);  // putting request back in queue so we don't loose any branches
                    continue;
                }
                if (cachedResponse) {
                    const newPost: Post = {
                        processId: post.processId,
                        stepNumber: post.stepNumber + 1,
                        lastProcessor: this.name,
                        data: {... post.data}
                    };
                    newPost.data[this.name] = cachedResponse;
                    this.mb.write('posts', newPost);
                    continue;
                }
                
                // lock that prevents two identical requests, fired very close to each other, to start the process twice
                this.db.set(cacheKey, "running");

                // running wps
                const products = await this.wps.execute(parameterCombination);
                const newPost: Post = {
                    processId: post.processId,
                    stepNumber: post.stepNumber + 1,
                    lastProcessor: this.name,
                    data: {...  post.data}
                };
                for (const product of products) {
                    if (!newPost.data[this.name]) newPost.data[this.name] = {};
                    newPost.data[this.name][product.name] = product.value;
                }
                // writing to queue
                this.mb.write('posts', newPost);


                // setting cache
                this.db.set(cacheKey, newPost.data[this.name]);
            }

        });
    }

    protected validParameterCombinations(post: Post): KvPair[][] {

        // if the post already contains outputs from this service, return []
        if (post.data[this.name]) return [];
        
        // if the post doesn't contain a required input, return []
        const requiredInputs = this.getRequiredInputNames();
        const givenInputs    = getProvidedProductNames(post);
        const missingInputs  = listExcept(requiredInputs, givenInputs);
        if (missingInputs.length > 0) return [];
        
        // if the post doesn't contain a config-parameter of this service, run with all possible values of that config-parameter.
        const configurableInputs                    = this.getConfigurableInputNames();
        const unspecifiedConfigs                    = listExcept(configurableInputs, givenInputs);
        const specifiedConfigs                      = listExcept(configurableInputs, unspecifiedConfigs);
        const givenConfigParaValues: KvPair[][]     = specifiedConfigs.map(cName => [getParaFromPost(cName, post)]);
        const givenNonConfigParaValues: KvPair[][]  = requiredInputs.map(pName => [getParaFromPost(pName, post)]);
        const unspecifiedConfigValues: KvPair[][]   = unspecifiedConfigs.map(pName => this.getAllPossibleValues(pName));
        
        const allParas: KvPair[][] = [...givenNonConfigParaValues, ...givenConfigParaValues, ...unspecifiedConfigValues];
        const paraPerms = permutations(allParas);
        return paraPerms;
    }

    private getRequiredInputNames(): string[] {
        const names: string[] = [];
        for (const input of this.wps.inputs) {
            if (! Object.keys(input).includes('options') ) {
                names.push(input.name);
            }
        }
        return names;
    }

    private getConfigurableInputNames(): string[] {
        const names: string[] = [];
        for (const input of this.wps.inputs) {
            if (Object.keys(input).includes('options') ) {
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


export class ModelpropWrapper extends Wrapper {}

export class ShakygroundWrapper extends Wrapper {}

export class AssetMasterWrapper extends Wrapper {}

export class DeusWrapper extends Wrapper {}




