import { chainSpec } from "polkadot-api/chains/paseo_people"
import { getSmProvider } from "polkadot-api/sm-provider"
import { start } from "polkadot-api/smoldot"
import { paseo_people } from "@polkadot-api/descriptors"
import { createClient } from "polkadot-api"
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { getMetadata } from "@polkadot-api/descriptors"
import { withLogsRecorder } from "polkadot-api/logs-provider"

const client = createClient(
  withLogsRecorder(console.log, getWsProvider("wss://people-paseo.dotters.network")),
  { getMetadata },
)
 
// get the safely typed API
const api = client.getTypedApi(paseo_people)

const address = "1ssdhRq9sxzNSAQebDPq7AMsjRxjQ3t9CQhmjYcsD1YqCxx"
const identity = await api.query.Identity.IdentityOf.getValue(address);
console.log(identity);

const test2 = await api.query.Balances.Account.getValue(address);
console.log(test2)