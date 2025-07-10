// Complete swap implementation
import { RouterBuilder } from "@paraspell/xcm-router";
import { getPolkadotSigner } from "polkadot-api/signer";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import dotenv from "dotenv";
import { AccountId } from "polkadot-api";

dotenv.config();

export function signerOf() {
  const miniSecret = entropyToMiniSecret(
    // Enter seed phrase as private key
    mnemonicToEntropy(process.env.PRIVATE_KEY)
  );
  const derive = sr25519CreateDerive(miniSecret);
  const aliceKeyPair = derive("");
  return getPolkadotSigner(
    aliceKeyPair.publicKey,
    "Sr25519",
    aliceKeyPair.sign
  );
}

export class TokenSwapper {
  async swapTokens() {
    const from = "Polkadot";
    const to = "AssetHubPolkadot";
    const currencyFrom = { symbol: "DOT" };
    const currencyTo = { symbol: "USDT" };
    const amount = "1000000000";
    const signer = signerOf();
    const ss58Format = "0";
    const address = AccountId(ss58Format).dec(signer.publicKey);
    console.log("Address: ", address);
    return RouterBuilder()
      .from(from)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .slippagePct("1")
      .senderAddress(address)
      .recipientAddress(address)
      .signer(signer)
      .onStatusChange(() => {})
      .build();
  }
}

async function main() {
  const swapper = new TokenSwapper();
  const swap = await swapper.swapTokens();
  console.log(swap);
}

main();
