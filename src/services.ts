import { sleep } from './utils';
import { Wps, WpsInput, KvPair } from './infra';
import { peruCvt1, peruCvt2, peruCvt3, saraVulnerability, suppasriVulnerability } from './products';


export class Deus implements Wps {
    inputs: WpsInput[] = [{
        name: 'shakemap'
    }, {
        name: 'vulnerability'
    }, {
        name: 'exposure'
    }];

    async execute(args: KvPair[]): Promise<KvPair[]> {
        await sleep(Math.random() * 1000);
        const shakemap = args.find(a => a.name === 'shakemap');
        const vulnerability = args.find(a => a.name === 'vulnerability');
        const exposure = args.find(a => a.name === 'exposure');
        console.log(`deus returns eqDamage_${shakemap?.value}_${vulnerability?.value.name}_${exposure?.value.name}`);
        return [{
            name: 'eqDamage',
            value: `eqDamage_${shakemap?.value}_${vulnerability?.value.name}_${exposure?.value.name}`
        }];
    }

}

export class Assetmaster implements Wps {
    inputs: WpsInput[] = [{
        name: 'model',
        options: ["Peru-CVT1", "Peru-CVT2", "Peru-CVT3"]
    }];

    async execute(args: KvPair[]): Promise<KvPair[]> {
        await sleep(Math.random() * 1000);
        const model = args.find(a => a.name === 'model');
        switch (model?.value) {
            case 'Peru-CVT1':
                console.log(`assetmaster returns ${peruCvt1.name}`)
                return [{ name: 'exposure', value: peruCvt1 }];
            case 'Peru-CVT2':
                console.log(`assetmaster returns ${peruCvt2.name}`)
                return [{ name: 'exposure', value: peruCvt2 }];
            case 'Peru-CVT3':
                console.log(`assetmaster returns ${peruCvt3.name}`)
                return [{ name: 'exposure', value: peruCvt3 }];
            default:
                throw new Error(`No such model: ${model?.value}`);
        }
    }
}

export class Modelprop implements Wps {
    inputs: WpsInput[] = [{
        name: 'schema',
        options: ['SARA_v1.0', 'Suppasri']
    }];

    async execute(args: KvPair[]): Promise<KvPair[]> {
        await sleep(Math.random() * 1000);
        const schema = args.find(a => a.name === 'schema');
        switch (schema?.value) {
            case 'SARA_v1.0':
                console.log(`modelprop returns ${saraVulnerability.name}`)
                return [{ name: 'vulnerability', value: saraVulnerability }];
            case 'Suppasri':
                console.log(`modelprop returns ${suppasriVulnerability.name}`)
                return [{ name: 'vulnerability', value: suppasriVulnerability }];
            default:
                throw new Error(`No such schema: ${schema?.value}`);
        }
    }
}

export class Shakyground implements Wps {
    inputs: WpsInput[] = [{
        name: 'eqParas'
    }, {
        name: 'gmpe',
        options: ['gmpe1', 'gmpe2']
    }];
    
    async execute(args: KvPair[]): Promise<KvPair[]> {
        await sleep(Math.random() * 1000);
        const eqParas = args.find(a => a.name === 'eqParas');
        const gmpe = args.find(a => a.name === 'gmpe');
        console.log(`shakyground returns shakemap_${eqParas?.value}_${gmpe?.value}`)
        return [{
            name: 'shakemap',
            value: `shakemap_${eqParas?.value}_${gmpe?.value}`
        }];
    }
}