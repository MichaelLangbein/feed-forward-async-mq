import { Wps, Database, MessageBus, KvPair, WpsOptionInput } from './infra';
import { Post, getProvidedProductNames, getParaFromPost } from './post';
import { listExcept, permutations } from './utils';


export class Wrapper {

    constructor(protected name: string, protected db: Database, protected mb: MessageBus, protected wps: Wps) {
        this.init();
    }

    protected init() {
        this.mb.read<Post>('posts').subscribe(async post => {
            for (const parameterCombination of this.validParameterCombinations(post)) {
                const products = await this.wps.execute(parameterCombination);
                const newPost = {...post};
                for (const product of products) {
                    if (!newPost.data[this.name]) newPost.data[this.name] = {};
                    newPost.data[this.name][product.name] = product.value;
                }
                this.mb.write('posts', newPost);
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
        // @TODO: or look up if the missing inputs have already been provided in the past?
        
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




