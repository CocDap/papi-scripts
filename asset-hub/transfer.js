import { paseo_asset_hub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { getMetadata } from "@polkadot-api/descriptors"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import { chainSpec } from "polkadot-api/chains/westend2_asset_hub"
import { westend_asset_hub } from "@polkadot-api/descriptors"
import { start } from "polkadot-api/smoldot"
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { getSmProvider } from "polkadot-api/sm-provider"
import { getPolkadotSigner } from "polkadot-api/signer";
import {
    entropyToMiniSecret,
    mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });



// 3. User Account
const seed = process.env.PRIVATE_KEY;

console.log("Seed:", seed);


const derive = sr25519CreateDerive(seed);
const aliceKeyPair = derive("");

const alice = getPolkadotSigner(
    aliceKeyPair.publicKey,
    "Sr25519",
    aliceKeyPair.sign,
  )


const ASSET_HUB_PASEO = "wss://asset-hub-paseo-rpc.n.dwellir.com"
const ASSET_HUB_WESTEND = "wss://polkadot-asset-hub-rpc.polkadot.io"

async function main() {
    const client = createClient(
        getWsProvider(ASSET_HUB_WESTEND),
      );

    // get the safely typed API
    const api = client.getUnsafeApi()



    const address = "14aFkYiwZFMT8pri6eRnnj8Ev9Bsj3W6rqwQHtfJxgyDw5Zq"


    const transfer = await api.tx.Balances.transfer_keep_alive({
        dest: {
            type: 'Id',
            value: address,
        }, value: BigInt(10000000)
    })
    console.log("Res:", transfer);


    const origin = {
        type: 'system',
        value: {
              type: 'Signed',
              value: address
        }
      }
    const dryRun = await api.apis.DryRunApi.dry_run_call(
        origin,
        transfer.decodedCall,
        3
    )
    console.log("Dry Run:", dryRun);

    transfer.signSubmitAndWatch(alice).subscribe({
        next: (event) => {
          console.log("Tx event: ", event.type)
          if (event.type === "txBestBlocksState") {
            console.log("The tx is now in a best block, check it out:")
            console.log(`https://assethub-westend.subscan.io/extrinsic/${event.txHash}`)
          }
        },
        error: console.error,
        complete() {
          client.destroy()
        },
      })
}



main();
