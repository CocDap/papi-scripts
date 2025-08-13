
import { getPolkadotSigner } from "polkadot-api/signer";
import {
    entropyToMiniSecret,
    mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import dotenv from "dotenv";

import { createClient } from "polkadot-api"
import { paseo, paseo_asset_hub, bifrost_polkadot} from "@polkadot-api/descriptors"
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { Binary } from 'polkadot-api';
import { ss58Decode } from '@polkadot-labs/hdkd-helpers';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';


import { MultiAddress } from '@polkadot-api/descriptors'

dotenv.config();




// 1. Source Parachain Configuration

const BIFROST_POLKADOT = "wss://bifrost-polkadot.dotters.network";

// 3. User Account
const seed = process.env.PRIVATE_KEY;


const derive = sr25519CreateDerive(seed);
const aliceKeyPair = derive("");
// 4. XCM Configuration
//    Weight needed for the remote execution on Asset Hub.
//    'Unlimited' is used for simplicity, but for production, you should calculate
//    and specify a reasonable weight limit.
const XCM_WEIGHT_LIMIT = { Unlimited: null };


const alice = getPolkadotSigner(
    aliceKeyPair.publicKey,
    "Sr25519",
    aliceKeyPair.sign,
  )
  



async function main() {
    // --- 1. Connect to the Source Parachain ---
    console.log(`🔌 Connecting to source relay at ${BIFROST_POLKADOT}...`);
    // const sourceClient = createClient(
    //     withPolkadotSdkCompat(getWsProvider(BIFROST_POLKADOT)),
    //   );
    const sourceClient = createClient(
        getWsProvider(BIFROST_POLKADOT),
      );
    const sourceApi = sourceClient.getTypedApi(bifrost_polkadot);
    // Define the amount to mint (in DOT, with 10 decimals)
    const dotAmount = 5000000000n; // 100 DOT
    // const tx = sourceApi.tx.VtokenMinting.mint({
    //     currency_id: { Token2: 0 } ,
    //     currency_amount: dotAmount,
    //     remark: Binary.fromText("0x"),
    //     channel_id: undefined
    // })
    console.log(sourceApi.tx.VtokenMinting.mint({
        currency_id: { Token2: 0 } ,
        currency_amount: dotAmount,
        remark: Binary.fromText("0x"),
        channel_id: undefined
    }))
    const tx = sourceApi.tx.VtokenMinting.mint({
        currency_id:{ type: 'Token2', value: 0 },
        currency_amount: dotAmount,
        remark: Binary.fromText("0x"),
        channel_id: undefined
    });

    try {
        const txHash = await tx.signAndSubmit(alice)
        console.log(`\n🎉 Transaction sent from source chain with hash: ${txHash}`);
        console.log("👀 Waiting for transaction to be included in a block...");

        // // Optional: Wait for finalization and check events
        // const { events } = await sourceApi.getTx(txHash);

        // console.log("\n✅ Transaction finalized. Events on source chain:");
        // events.forEach(e => {
        //     console.log(`\t- ${e.pallet.name}::${e.pallet.event.name}`);
        //     if (e.pallet.name === 'polkadotXcm' && e.pallet.event.name === 'Attempted') {
        //         console.log(`\t  Outcome:`, e.pallet.event.value.outcome);
        //     }
        // });

        // console.log("\n\n➡️ Next Step: Check Asset Hub (e.g., on PolkadotJS-Apps or Subscan) to see if the new NFT collection was created.");
        // console.log("You can check the storage for `nfts.collection` and look for the next available collection ID.");

    } catch (error) {
        console.error("❌ An error occurred:", error);
    } finally {
        // --- 7. Disconnect from the client ---
        sourceClient.destroy();
        console.log("\n🔌 Disconnected from source parachain.");
    }



}

main().catch(console.error);



