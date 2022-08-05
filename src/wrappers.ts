import { Wps, Database, MessageBus, KvPair, WpsOptionInput } from './infra';
import { Post, getProvidedProductNames, getParaFromPost } from './post';
import { listIntersection, listExcept, permutations, Queue, listFilter } from './utils';
import hash from 'object-hash';




class WrapperMemory {
    constructor(wps: Wps) {}
}


export class Wrapper {

    protected parameterComboQueue = new Queue<{processId: number, irrelevantParameters: KvPair[], relevantParameters: KvPair[]}>(30);
    protected memory: WrapperMemory;

    constructor(protected name: string, protected db: Database<KvPair[]>, protected mb: MessageBus, protected wps: Wps) {
        this.memory = new WrapperMemory(this.wps);
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


    protected validParameterCombinations(parameters: KvPair[]): KvPair[][] {
        const parameterNames = parameters.map(p => p.name);
        const outputNames = this.getOutputNames();
        const requiredInputNames = this.getRequiredInputNames();
        const optionalInputNames = this.getOptionalInputNames();
        const givenRequiredInputNames = listFilter(parameterNames, requiredInputNames);
        const givenOptionalInputNames = listFilter(parameterNames, optionalInputNames);
        const missingRequiredInputNames = listExcept(requiredInputNames, givenRequiredInputNames);
        const missingOptionalInputNames = listExcept(optionalInputNames, givenOptionalInputNames);
        const givenRequiredInputValues = givenRequiredInputNames.map(name => parameters.find(p => p.name === name)).filter(v => v !== undefined) as KvPair[];
        const givenOptionalInputValues = givenOptionalInputNames.map(name => parameters.find(p => p.name === name)).filter(v => v !== undefined) as KvPair[];

        // 1: if the post already contains outputs from this service, return []
        const oldOutputs = listIntersection(parameterNames, outputNames);
        if (oldOutputs.length > 0) return [];

        // 2: if the post already contains a complete set of inputs, return that
        if (missingRequiredInputNames.length === 0) {
            if (missingOptionalInputNames.length === 0) {
                return [parameters];
            } else {
                // 2.1: if optional paras are missing, return all possible values for them
                const optionalParameterValues: KvPair[][] = missingOptionalInputNames.map(name => this.getOptionalParameterValues(name));
                const optionalParameterPermutations = permutations(optionalParameterValues);
                const validConfigs: KvPair[][] = [];
                for (const optionalParameterPermutation of optionalParameterPermutations) {
                    validConfigs.push([... givenRequiredInputValues, ...givenOptionalInputValues, ... optionalParameterPermutation]);
                }
                return validConfigs;
            }
        }

        // 3: if the post is missing a required input, see if you can fill it up from memory
        if (missingRequiredInputNames.length > 0) {
            // 3.1: if so, return and remove memory
            
            // 3.2: if not, add given data to memory
        }
    }


    private getOptionalParameterValues(name: string): KvPair[] {
        const para = this.getPara(name) as WpsOptionInput;
        const options = para.options.map(o => ({ name: name, value: o }));
        return options;
    }

    private getRelevantParameters(paras: KvPair[]): KvPair[] {
        const relevantParaNames = this.getParaNames();
        const relevantParas = paras.filter(p => relevantParaNames.includes(p.name));
        return relevantParas;
    }

    private getIrrelevantParameters(paras: KvPair[]): KvPair[] {
        const relevantParaNames = this.getParaNames();
        const irrelevantParas = paras.filter(p => !(relevantParaNames.includes(p.name)));
        return irrelevantParas;
    }

    private getParaNames(): string[] {
        return this.wps.inputs.map(i => i.name);
    }

    private getPara(name: string) {
        return this.wps.inputs.find(i => i.name === name);
    }

    private getOutputNames(): string[] {
        return this.wps.outputNames;
    }

    private getOptionalInputNames(): string[] {
        //@ts-ignore
        return this.wps.inputs.filter(i => i.options).map(i => i.name);
    }

    private getRequiredInputNames(): string[] {
        //@ts-ignore
        return this.wps.inputs.filter(i => !(i.options)).map(i => i.name);
    }

}


export class ModelpropWrapper extends Wrapper { }

export class ShakygroundWrapper extends Wrapper { }

export class AssetMasterWrapper extends Wrapper { }

export class DeusWrapper extends Wrapper { }




