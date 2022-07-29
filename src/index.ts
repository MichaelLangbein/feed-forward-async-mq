import { MessageBus, Database } from './infra';
import { Post } from './post';
import { Modelprop, Shakyground, Assetmaster, Deus, Ab, OneTwo } from './services';
import { sleep } from './utils';
import { ModelpropWrapper, ShakygroundWrapper, AssetMasterWrapper, DeusWrapper, Wrapper } from './wrappers';


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
}


// const abWrapper = new Wrapper('ab', database, messageBus, new Ab());
// const oneTwoWrapper = new Wrapper('12', database, messageBus, new OneTwo());

// const userRequest: Post = {
//   processId: 1,
//   stepNumber: 0,
//   lastProcessor: 'user',
//   data: {
//     user: {
//       // Letter: 'A'
//     }
//   }
// };


// @TODO: if the user requests contains options, split them into single-value-posts
messageBus.write("posts", userRequest);
messageBus.subscribe("posts", async (post) => {
  console.log(post.data.deus?.eqDamage);
  // console.log(post.data['ab'], post.data['12'])
})



