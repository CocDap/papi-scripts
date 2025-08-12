
import { getPolkadotSigner } from "polkadot-api/signer";
import {
    entropyToMiniSecret,
    mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import dotenv from "dotenv";

import { createClient } from "polkadot-api"
import { paseo, paseo_asset_hub, polkadot, polkadot_asset_hub } from "@polkadot-api/descriptors"
import { getWsProvider } from "polkadot-api/ws-provider/node"
import { Binary } from 'polkadot-api';
import { ss58Decode } from '@polkadot-labs/hdkd-helpers';
import { withPolkadotSdkCompat } from 'polkadot-api/polkadot-sdk-compat';
import {
    XcmVersionedXcm,
    XcmVersionedLocation,
    XcmV3Junction,
    XcmV3Junctions,
    XcmV3WeightLimit,
    XcmV3MultiassetFungibility,
    XcmV3MultiassetAssetId,
    XcmV3Instruction,
    XcmV3MultiassetMultiAssetFilter,
    XcmV3MultiassetWildMultiAsset,
  } from '@polkadot-api/descriptors';

import { MultiAddress } from '@polkadot-api/descriptors'

dotenv.config();




// 1. Source Parachain Configuration

// const SOURCE_CHAIN_WS = "wss://paseo-rpc.n.dwellir.com";
// const DESTINATION_CHAIN_WS = "wss://asset-hub-paseo-rpc.n.dwellir.com";

const SOURCE_CHAIN_WS = "wss://polkadot-rpc.n.dwellir.com"
const DESTINATION_CHAIN_WS = "wss://asset-hub-polkadot-rpc.n.dwellir.com"

// 2. Destination Parachain (Asset Hub)
//    The ParaID for Asset Hub on Polkadot is 1000, on Kusama is 1000, on Westend is 1000.
const ASSET_HUB_PARA_ID = 1000;

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
  
  const userPublicKey = ss58Decode("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY")[0];
  const idBeneficiary = Binary.fromBytes(userPublicKey);


/**
 * Derives the Sovereign Account of a parachain on a sibling parachain.
 * This is the account that will act as the `admin` for the NFT collection.
 *
 * @param paraId The parachain ID of the origin chain.
 * @returns The SS58 address of the sovereign account.
 */
function getSovereignAccount(paraId) {
    // The formula is 'sibl' + little-endian encoded paraId, padded to 32 bytes.
    const prefix = new TextEncoder().encode("sibl");
    const paraIdBytes = new Uint8Array(4);
    new DataView(paraIdBytes.buffer).setUint32(0, paraId, true); // true for little-endian

    const combined = new Uint8Array(prefix.length + paraIdBytes.length);
    combined.set(prefix);
    combined.set(paraIdBytes, prefix.length);

    // Hash the combined value to get the 32-byte account ID
    return blake2AsU8a(combined);
}


async function main() {
    // --- 1. Connect to the Source Parachain ---
    console.log(`🔌 Connecting to source relay at ${SOURCE_CHAIN_WS}...`);
    const sourceClient = createClient(
        withPolkadotSdkCompat(getWsProvider(SOURCE_CHAIN_WS)),
      );

    const sourceApi = sourceClient.getTypedApi(polkadot);


    const destinationClient = createClient(getWsProvider(DESTINATION_CHAIN_WS));
    const destinationApi = destinationClient.getTypedApi(polkadot_asset_hub);


    const admin = {
        Id: aliceKeyPair.publicKey,
    };

    const txCollection = destinationApi.tx.Nfts.create({
        admin: MultiAddress.Id("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY"),
        config: {
          settings: 0n,
          max_supply: undefined,
          mint_settings: {
            mint_type: { type: 'Issuer', value: undefined },
            price: undefined,
            start_block: undefined,
            end_block: undefined,
            default_item_settings: 0n,
          },
        },
      })

    // console.log("remote call:", remoteCall.decodedCall);
    // console.log(`✅ Encoded remote call 'nfts.create': ${toHex(remoteCall.getEncodedData())}`);
    // --- 4. Construct the XCM Message ---
    //    This message tells Asset Hub what to do.
    // const destination = { V4: { parents: 0, interior: { X1: [{ Parachain: ASSET_HUB_PARA_ID }] } } };

    // const instr1 = {
    //     WithdrawAsset: [
    //       {
    //         id: {
    //           parents: 0,
    //           interior: { X1: [{ PalletInstance: 3 }] },
    //         },
    //         fun: { Fungible: 10_000_000_000n },
    //       },
    //     ],
    //   };
    //   const instr2 = {
    //     BuyExecution: [
    //       {
    //         id: {
    //           parents: 0,
    //           interior: { X1: [{ PalletInstance: 3 }] },
    //         },
    //         fun: { Fungible: 10_000_000_000n },
    //       },
    //       { Unlimited: null },
    //     ],
    //   };
    //   const instr3 = {
    //     Transact: {
    //       originKind: 'SovereignAccount',
    //       requireWeightAtMost: { refTime: 40000000000n, proofSize: 900000n },
    //       call: remoteCall.decodedCall,
    //     },
    //   };
    //   const message = { V4: [instr1, instr2, instr3] };
    // console.log("📝 Constructed XCM message. Preparing to send...");

    // const destination = {
    //     V3: {
    //         parents: 0, // 0 = Stay on the Relay Chain to send down to a child parachain
    //         interior: { X1: { Parachain: ASSET_HUB_PARA_ID } },
    //     },
    // };

    // const message = {
    //     V3: [
    //         // Instruction 1: Pay for execution time on Asset Hub.
    //         // This withdraws the relay chain's native token from the user's account.
    //         {
    //             WithdrawAsset: [
    //                 {
    //                     id: { Concrete: { parents: 0, interior: "Here" } }, // Relay chain native token
    //                     fun: { Fungible: 1_000_000_000 }, // Amount to pay for fees, adjust as needed
    //                 },
    //             ],
    //         },
    //         // Instruction 2: Buy execution time with the withdrawn asset.
    //         {
    //             BuyExecution: {
    //                 fees: {
    //                     id: { Concrete: { parents: 0, interior: "Here" } },
    //                     fun: { Fungible: 1_000_000_000 },
    //                 },
    //                 weightLimit: XCM_WEIGHT_LIMIT,
    //             },
    //         },
    //         // Instruction 3: Change the origin.
    //         // This tells Asset Hub to treat the origin of the next instruction
    //         // as the user's own account, not as the Relay Chain itself.
    //         {
    //             DescendOrigin: {
    //                 X1: { AccountId32: { network: null, id: aliceKeyPair.publicKey } }
    //             }
    //         },
    //         // Instruction 4: The main action - execute the `nfts.create` call.
    //         // The `originKind` is `Native` because `DescendOrigin` has already set
    //         // the origin to be a native account on the target chain.
    //         {
    //             Transact: {
    //                 originKind: "Native",
    //                 requireWeightAtMost: { refTime: 1_000_000_000, proofSize: 900000 }, // Weight required for the nfts.create call
    //                 call: remoteCall.decodedCall,
    //             },
    //         },
    //     ],
    // };

    console.log("Here:", (await txCollection.getEncodedData()).asHex())
    const destination = XcmVersionedLocation.V3({
        parents: 0, // 0 = Sending to a child parachain from the Relay Chain
        interior: XcmV3Junctions.X1(XcmV3Junction.Parachain(ASSET_HUB_PARA_ID)),
    });

    // 0x340000d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d000000000000000000000000000000000000000000
    const message = XcmVersionedXcm.V3([
        // Instruction 1: Pay for execution time on Asset Hub.
        XcmV3Instruction.WithdrawAsset([{
            id: XcmV3MultiassetAssetId.Concrete({
                parents: 0,
                interior: XcmV3Junctions.Here()
            }),
            fun: XcmV3MultiassetFungibility.Fungible(10_000_000_000_000n),
        }, ]),
        // Instruction 2: Buy execution time with the withdrawn asset.
        XcmV3Instruction.BuyExecution({
            fees: {
                id: XcmV3MultiassetAssetId.Concrete({
                    parents: 0,
                    interior: XcmV3Junctions.Here()
                }),
                fun: XcmV3MultiassetFungibility.Fungible(10_000_000_000_000n),
            },
            weight_limit: XcmV3WeightLimit.Unlimited(),
        }),
        // // Instruction 3: Change the origin.
        // XcmV3Instruction.DescendOrigin(
        //     XcmV3Junctions.X1(
        //         XcmV3Junction.AccountId32({
        //             network: undefined,
        //             id: idBeneficiary
        //         })
        //     )
        // ),
        // Instruction 4: The main action - execute the `nfts.create` call.
        XcmV3Instruction.Transact({
            origin_kind: "SovereignAccount",
            require_weight_at_most: {
                ref_time: 2_000_000_000_000n,
                proof_size: 2_000_000n
            },
            call: await txCollection.getEncodedData(),
        }),
        // // Instruction 5 (Optional but recommended): Refund any surplus weight fees.
        // XcmV3Instruction.RefundSurplus(),
        // // Instruction 6 (Optional but recommended): Deposit the refund back to the user's account on the Relay Chain.
        // XcmV3Instruction.DepositAsset({
        //     assets: XcmV3MultiassetMultiAssetFilter.Wild(
        //         XcmV3MultiassetWildMultiAsset.All()
        //     ),
        //     beneficiary: {
        //         parents: 1,
        //         interior: XcmV3Junctions.X1(
        //             XcmV3Junction.AccountId32({
        //                 network: undefined,
        //                 id: idBeneficiary
        //             })
        //         ),
        //     },
        // }),
    ]);

    console.log("destination:", destination);
    console.log("message:", message);



    // --- 5. Build and Send the `xcmPallet.send` Transaction ---
    //    On the Relay Chain, we use `xcmPallet.send` to dispatch the XCM.
    // const xcmTx = sourceApi.tx.XcmPallet.send({
    //     dest: destination,
    //     message: message,
    // });
    // console.log(xcmTx);
    // console.log(xcmTx.decodedCall);

    const dryRunResult = await sourceApi.apis.DryRunApi.dry_run_xcm(
        destination,
        message,
      );

      console.log("Dry Run Result:", dryRunResult);

    // try {
    //     const txHash = await xcmTx.signAndSubmit(alice);
    //     console.log(`\n🎉 Transaction sent from source chain with hash: ${txHash}`);
    //     console.log("👀 Waiting for transaction to be included in a block...");

    //     // // Optional: Wait for finalization and check events
    //     // const { events } = await sourceApi.getTx(txHash);

    //     // console.log("\n✅ Transaction finalized. Events on source chain:");
    //     // events.forEach(e => {
    //     //     console.log(`\t- ${e.pallet.name}::${e.pallet.event.name}`);
    //     //     if (e.pallet.name === 'polkadotXcm' && e.pallet.event.name === 'Attempted') {
    //     //         console.log(`\t  Outcome:`, e.pallet.event.value.outcome);
    //     //     }
    //     // });

    //     // console.log("\n\n➡️ Next Step: Check Asset Hub (e.g., on PolkadotJS-Apps or Subscan) to see if the new NFT collection was created.");
    //     // console.log("You can check the storage for `nfts.collection` and look for the next available collection ID.");

    // } catch (error) {
    //     console.error("❌ An error occurred:", error);
    // } finally {
    //     // --- 7. Disconnect from the client ---
    //     sourceClient.destroy();
    //     console.log("\n🔌 Disconnected from source parachain.");
    // }



}

main().catch(console.error);

