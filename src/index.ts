import { MessageBus, Database } from './infra';
import { Post } from './post';
import { Modelprop, Shakyground, Assetmaster, Deus } from './services';
import { ModelpropWrapper, ShakygroundWrapper, AssetMasterWrapper, DeusWrapper } from './wrappers';


const messageBus = new MessageBus();
const database = new Database();

const modelpropWrapper = new ModelpropWrapper('modelprop', database, messageBus, new Modelprop());
const shakygroundWrapper = new ShakygroundWrapper('shakyground', database, messageBus, new Shakyground());
const assetmasterWrapper = new AssetMasterWrapper('assetmaster', database, messageBus, new Assetmaster());
const deusWrapper = new DeusWrapper('deus', database, messageBus, new Deus());




const userRequest: Post = {
  processId: 42,
  data: {
    user: {
      eqParas: "magnitude8.5",
      gmpe: "gmpe1",
    }
  }
}
// @TODO: if the user requests contains options, split them into single-value-posts
messageBus.write("posts", userRequest);
messageBus.read("posts").subscribe((data) => {
  console.log('reading from `posts`: ', data);
})

setTimeout(() => {
  // @ts-ignore
  for (const entry in database.data) {
    const data = database.get(entry);
    console.log(data.assetmaster.exposure)
    console.log(data.modelprop.vulnerability)
    console.log(data.deus.eqDamage)
  }
}, 3000)
