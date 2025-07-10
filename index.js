import { createClient } from "polkadot-api";
import { getSmProvider } from "polkadot-api/sm-provider";
import { paseo_hydra, kusama, moonriver } from "@polkadot-api/descriptors";
import { chainSpec as kusamaSpec } from "polkadot-api/chains/ksmcc3";
// import { chainSpec as moonriverSpec } from "polkadot-api/chains/moonriver";

// import { chainSpec as paseoHydraSpec } from "polkadot-api/chains/paseo_hydra";
import { start } from "@polkadot-api/smoldot";


import fs from "fs";


const acalaSpec = JSON.stringify({

})


async function main() {
    const paseoHydraSpec = JSON.stringify({
        "name": "Hydration (Paseo)",
        "id": "paseo-hydra",
        "chainType": "Live",
        "bootNodes": [],
        "telemetryEndpoints": null,
        "protocolId": null,
        "properties": {
            "ss58Format": 0,
            "tokenDecimals": 12,
            "tokenSymbol": "HDX"
        },
        "relay_chain": "paseo",
        "para_id": 2034,
        "codeSubstitutes": {},
        "genesis": {
            "stateRootHash": "0x7b197b23476426acf23b551f29a335e2263317096bf17d8b597b311b9440693b"
        }
    })

    const moonriverSpec = JSON.stringify({
        "name": "Moonriver",
        "id": "moonriver",
        "chainType": "Live",
        "bootNodes": [],
        "telemetryEndpoints": null,
        "protocolId": null,
        "properties": {
            "ss58Format": 1285,
            "tokenDecimals": 18,
            "tokenSymbol": "MOVR"
        },
        "relay_chain": "kusama",
        "para_id": 1285,
        "codeSubstitutes": {},
        "genesis": {
            "stateRootHash": "0xa6345aff162d4e6c6633d91adf9b21a3f84da5e90e587668f16539d4ce496d08"
        }
    })

    // const acalaSpec = JSON.stringify({
    //     "name": "Acala",
    //     "id": "acala",
    //     "chainType": "Live",
    //     "bootNodes": [
    //       "/dns/acala-bootnode-0.aca-api.network/tcp/30333/p2p/12D3KooWFMS2SbyhiELJ4SqCWBwE23T9xqLmzRET3U6aTEsNkhKD",
    //       "/dns/acala-bootnode-0.aca-api.network/tcp/30334/ws/p2p/12D3KooWFMS2SbyhiELJ4SqCWBwE23T9xqLmzRET3U6aTEsNkhKD",
    //       "/dns/acala-bootnode-1.aca-api.network/tcp/30333/p2p/12D3KooWKapuzLADXUrshtZnD3F13E2WEDr8eonZ23qJSvPXBuDy",
    //       "/dns/acala-bootnode-1.aca-api.network/tcp/30334/ws/p2p/12D3KooWKapuzLADXUrshtZnD3F13E2WEDr8eonZ23qJSvPXBuDy",
    //       "/dns/acala-bootnode-2.aca-api.network/tcp/30333/p2p/12D3KooWApQeoWSJN8KmMuE89pyYbDd8b19vpPw8rceoWTVBom6F",
    //       "/dns/acala-bootnode-2.aca-api.network/tcp/30334/ws/p2p/12D3KooWApQeoWSJN8KmMuE89pyYbDd8b19vpPw8rceoWTVBom6F",
    //       "/dns/acala-bootnode-3.aca-api.network/tcp/30333/p2p/12D3KooWALr3yVfDZKn3zg9LuL7mGXg94oT4fxEJfAgierZZTCNn",
    //       "/dns/acala-bootnode-3.aca-api.network/tcp/30334/ws/p2p/12D3KooWALr3yVfDZKn3zg9LuL7mGXg94oT4fxEJfAgierZZTCNn",
    //       "/dns/node-6875956581798973440-0.p2p.onfinality.io/tcp/14014/ws/p2p/12D3KooWEwvZUw3pot2aw5mjRQnGgbnd5ZHgPBmo9RRq3hFkUbgk",
    //       "/dns/acala-boot.dwellir.com/tcp/443/wss/p2p/12D3KooWNyQNjp8ttyqA74knQjyuZUf1w5MechLzRnpMSyPvb3A1"
    //     ],
    //     "telemetryEndpoints": [
    //       [
    //         "/dns/telemetry.polkadot.io/tcp/443/x-parity-wss/%2Fsubmit%2F",
    //         0
    //       ]
    //     ],
    //     "properties": {
    //       "ss58Format": 10,
    //       "tokenDecimals": [
    //         12,
    //         12,
    //         10,
    //         10
    //       ],
    //       "tokenSymbol": [
    //         "ACA",
    //         "AUSD",
    //         "DOT",
    //         "LDOT"
    //       ]
    //     },
    //     "relay_chain": "polkadot",
    //     "para_id": 2000,
    //     "codeSubstitutes": {},
    //     "genesis": {
    //         "stateRootHash": "0x010c5745a5d42bcfbe0a644d5a2a4e22e2ff0fd378d48208ecfacea5b7e05a74"
    //       }
    //   });



    // Read the JSON file synchronously
    const acalaSpec = JSON.parse(fs.readFileSync("./polkadot-acala.json", "utf8"));

    console.log("Acala chain spec:", acalaSpec);



    // 1. Start smoldot (main thread, or use from-worker for web/worker)
    const smoldot = start();

    console.log("Adding chain");
    const paseoChain = smoldot.addChain({
        chainSpec: acalaSpec,
    });

    console.log("Creating provider");
    // 3. Create a provider from smoldot
    const provider = getSmProvider(paseoChain);

    console.log("Creating client");
    // 4. Create the Polkadot-API client
    const client = createClient(provider);

    console.log("Getting typed API");
    // 5. Get the typed API for Paseo hydration
    const paseoApi = client.getTypedApi(moonriver);

    console.log("Getting balance");
    // Get balance of an account
    const balance = await paseoApi.query.System.Account.getValue("0x6B75D8e8DF0C6F19b4233E3144e4A56DCe69Ae6D");
    console.log("Balance:", balance);

}

main();






