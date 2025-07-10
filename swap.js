// Complete swap implementation
import { RouterBuilder } from '@paraspell/xcm-router';
import { hexToU8a } from "@polkadot/util"
import { getPolkadotSigner, PolkadotSigner } from "polkadot-api/signer"
import { ed25519 } from "@noble/curves/ed25519"
import { Signer } from "@polkadot/types/types"
import { Keyring } from "@polkadot/api"

import dotenv from 'dotenv'
dotenv.config()

const keyring = new Keyring({ ss58Format: 0 })
export const me = () => {
  return buildAccount().address
}

export const buildAccount = () => {
    const seed = process.env.PRIVATE_KEY
    const pair = keyring.addFromSeed(hexToU8a(seed))
    return pair
}

export function signerOf() {
	const seed = process.env.PRIVATE_KEY
	const signer = getPolkadotSigner(
		ed25519.getPublicKey(seed),
		"Ed25519",
		(input) => ed25519.sign(input, seed),
	);
	return signer;
}



export class TokenSwapper {
  async swapTokens() {
    const from = 'Polkadot';
    const to = 'AssetHubPolkadot';
    const currencyFrom = { symbol: 'DOT' };
    const currencyTo = { symbol: 'USDT' };
    const amount = '1000000000';
    const recipientAddress = me();
    const signer = signerOf();
    return RouterBuilder()
      .from(from)
      .to(to)
      .currencyFrom(currencyFrom)
      .currencyTo(currencyTo)
      .amount(amount)
      .slippagePct('1')
      .senderAddress(senderAddress)
      .recipientAddress(recipientAddress)
      .signer(signer)
      .onStatusChange(onProgress || (() => {}))
      .build();
  }
}

async function main() {
  const swapper = new TokenSwapper();
  const swap = await swapper.swapTokens();
  console.log(swap);
}

main();