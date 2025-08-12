import { createClient } from "polkadot-api"
import { getSmProvider } from "polkadot-api/sm-provider"
import { start } from "polkadot-api/smoldot"
import { chainSpec } from "polkadot-api/chains/paseo_people"
import { paseo_people } from "@polkadot-api/descriptors"

const smoldot = start()

const client = createClient(getSmProvider(smoldot.addChain({ chainSpec })))
const testApi = client.getTypedApi(paseo_people)


async function run() {
    const address = "1ssdhRq9sxzNSAQebDPq7AMsjRxjQ3t9CQhmjYcsD1YqCxx"
    const identity = await testApi.query.Identity.IdentityOf.getValue(address);
    console.log(identity);
    client.destroy()
    smoldot.terminate()
}

await run()
process.exit(0)