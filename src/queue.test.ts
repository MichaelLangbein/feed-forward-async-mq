import { MessageBus, Database } from './infra';
import { Post } from './post';
import { Modelprop, Shakyground, Assetmaster, Deus, Ab, OneTwo } from './services';
import { ModelpropWrapper, ShakygroundWrapper, AssetMasterWrapper, DeusWrapper, Wrapper } from './wrappers';




test('check that all possible parameter combinations are obtained', async () => {


    const messageBus = new MessageBus();
    const database = new Database();

    const abWrapper = new Wrapper('ab', database, messageBus, new Ab());
    const oneTwoWrapper = new Wrapper('12', database, messageBus, new OneTwo());

    const userRequest: Post = {
        processId: 1,
        stepNumber: 0,
        lastProcessor: 'user',
        data: {
            user: {
                // Letter: 'A'
            }
        }
    };
    
    
    messageBus.write("posts", userRequest);

    const outputs = await new Promise<any[]>(resolve => {
        const outputs: any[] = [];
        messageBus.subscribe("posts", async (post: Post) => {
            outputs.push(post);
            if (outputs.length === 4) resolve(outputs);
        })
    });


    expect(outputs.length).toBe(4);
});


test('check that deus runs all possible para-combos', async () => {


    const messageBus = new MessageBus();
    const database = new Database();

    const modelpropWrapper = new ModelpropWrapper('modelprop', database, messageBus, new Modelprop());
    const shakygroundWrapper = new ShakygroundWrapper('shakyground', database, messageBus, new Shakyground());
    const assetmasterWrapper = new AssetMasterWrapper('assetmaster', database, messageBus, new Assetmaster());
    const deusWrapper = new DeusWrapper('deus', database, messageBus, new Deus());


    const userRequest: Post = {
        processId: 42,
        stepNumber: 0,
        lastProcessor: 'user',
        data: {
            user: {
                eqParas: "magnitude8.5",
                gmpe: "gmpe1",
            }
        }
    };
    
    
    messageBus.write("posts", userRequest);

    const deusOutputs = await new Promise<any[]>(resolve => {
        const deusOutputs: any[] = [];
        messageBus.subscribe("posts", async (post: Post) => {
            if (post.data.deus) {
                deusOutputs.push(post.data.deus);
                if (deusOutputs.length === 4) resolve(deusOutputs);
            }
        })
    });


    expect(deusOutputs.length).toBe(4);
});
