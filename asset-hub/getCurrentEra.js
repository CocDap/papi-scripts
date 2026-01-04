import { paseo_asset_hub } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { getMetadata } from "@polkadot-api/descriptors"
import { withLogsRecorder } from "polkadot-api/logs-provider"
import dotenv from "dotenv";

dotenv.config();


const ASSET_HUB_PASEO = "wss://asset-hub-paseo-rpc.n.dwellir.com"
const ASSET_HUB_WESTEND = "wss://polkadot-asset-hub-rpc.polkadot.io"

async function main() {
    const client = createClient(
        getWsProvider(ASSET_HUB_WESTEND),
      );

    // get the safely typed API
    const api = client.getUnsafeApi()


    const currentEra = await api.query.Staking.CurrentEra.getValue();

    console.log("Current era:", currentEra);

}



main();
