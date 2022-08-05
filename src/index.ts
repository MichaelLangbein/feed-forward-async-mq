import { MessageBus, Database, KvPair } from './infra';
import { Post } from './post';
import { Modelprop, Shakyground, Assetmaster, Deus, Ab, OneTwo } from './services';
import { sleep } from './utils';
import { ModelpropWrapper, ShakygroundWrapper, AssetMasterWrapper, DeusWrapper, Wrapper } from './wrappers';


const messageBus = new MessageBus();
const database = new Database<KvPair[]>();

const modelpropWrapper = new ModelpropWrapper('modelprop', database, messageBus, new Modelprop());
const shakygroundWrapper = new ShakygroundWrapper('shakyground', database, messageBus, new Shakyground());
const assetmasterWrapper = new AssetMasterWrapper('assetmaster', database, messageBus, new Assetmaster());
const deusWrapper = new DeusWrapper('deus', database, messageBus, new Deus());


const userRequest: Post = {
  processId: 42,
  data: [
    {name: 'mgpe', value: 'gmpe1'},
    {name: 'eqParas', value: 'magnitude8.5'}
  ]  
};


// @TODO: if the user requests contains options, split them into single-value-posts
messageBus.write("posts", userRequest);
messageBus.subscribe("posts", async (post) => {
  console.log(post.data.deus?.eqDamage);
})



