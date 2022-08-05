import { MessageBus, Database, KvPair } from './infra';
import { Post } from './post';
import { Modelprop, Shakyground, Assetmaster, Deus, Ab, OneTwo } from './services';
import { sleep } from './utils';
import { ModelpropWrapper, ShakygroundWrapper, AssetMasterWrapper, DeusWrapper, Wrapper } from './wrappers';


const messageBus = new MessageBus();

const modelpropWrapper = new ModelpropWrapper('modelprop', messageBus, new Modelprop());
const shakygroundWrapper = new ShakygroundWrapper('shakyground', messageBus, new Shakyground());
const assetmasterWrapper = new AssetMasterWrapper('assetmaster', messageBus, new Assetmaster());
const deusWrapper = new DeusWrapper('deus', messageBus, new Deus());


const userRequest: Post = {
  processId: 42,
  lastProcessor: 'user',
  data: [
    {name: 'mgpe', value: 'gmpe1'},
    {name: 'eqParas', value: 'magnitude8.5'}
  ]  
};


// @TODO: if the user requests contains options, split them into single-value-posts
messageBus.write("posts", userRequest);
messageBus.subscribe("posts", async (post: Post) => {
  console.log(post.data.find(d => d.name === 'eqDamage'));
})



