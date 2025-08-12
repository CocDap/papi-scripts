
import { getPolkadotSigner } from "polkadot-api/signer";
import {
  entropyToMiniSecret,
  mnemonicToEntropy,
} from "@polkadot-labs/hdkd-helpers";
import { sr25519CreateDerive } from "@polkadot-labs/hdkd";
import dotenv from "dotenv";
import { AccountId } from "polkadot-api";
import { Tx } from "@polkadot-api";
import { createClient } from "polkadot-api"
import {bifrost_polkadot}  from "polkadot-api/descriptors";

dotenv.config();


const BIFROST_RPC = "wss://bifrost-polkadot.ibp.network"

export function signerOf() {
  
    const seed = process.env.PRIVATE_KEY;
    const derive = sr25519CreateDerive(seed);
    const aliceKeyPair = derive("");
    return getPolkadotSigner(
      aliceKeyPair.publicKey,
      "Sr25519",
      aliceKeyPair.sign
    );
}



export class BifrostTransactionBuilder {
    constructor(client) {
        this.client = client;
        this.api = this.client.getTypedApi(bifrost_polkadot);
    }

    addStaking(amount, channelId = 0) {
        const tx = this.api.Slp.mint(
            { VToken: "DOT" },
            amount,
            channelId
        );
        this.transactions.push(tx);
        return this;
    }

    addUnstaking(amount, redemptionType) {
        if (redemptionType === "standard") {
            const tx = this.tx.slp.redeem({ VToken: "DOT" }, amount);
            this.transactions.push(tx);
        } else {
            const swapTx = this.buildInstantRedemptionTx(amount);
            this.transactions.push(swapTx);
        }
        return this;
    }

    buildBatch() {
        if (this.transactions.length === 1) {
            return this.transactions[0];
        }
        return this.tx.utility.batchAll({ calls: this.transactions });
    }

    async execute(signer) {
        const tx = this.buildBatch();
        return await this.submitTransaction(tx, signer);
    }

    buildInstantRedemptionTx(amount) {
        return this.tx.stableSwap.swap(
            0,
            0,
            1,
            amount,
            "0"
        );
    }

    async submitTransaction(tx, signer) {
        return new Promise((resolve, reject) => {
            const transaction = tx.signAndSend(signer);

            const handleStatus = (events) => {
                const finalized = events.find((e) => e.name === "finalized");
                if (finalized) {
                    const { txHash } = finalized.payload;
                    const dispatchError = events.find(
                        (e) => e.name === "txBestChainBlockIncluded" && e.payload.success === false
                    )?.payload.dispatchError;

                    if (dispatchError) {
                        resolve({
                            success: false,
                            transactionHash: txHash,
                            error: this.extractError(dispatchError),
                        });
                    } else {
                        resolve({
                            success: true,
                            transactionHash: txHash,
                            events: events,
                        });
                    }
                }
            };

            transaction.events$.subscribe({
                next: handleStatus,
                error: (err) => reject(err),
            });
        });
    }

    extractError(dispatchError) {
        if (dispatchError?.type === "Module") {
            return `${dispatchError.value.pallet}.${dispatchError.value.name}`;
        }
        return dispatchError?.toString() || "Unknown error";
    }
}


export class BifrostStakingService {
    constructor(client) {
      this.client = client;
      this.builder = new BifrostTransactionBuilder(client);
    }
  
    async stakeDot(params, signer) {
      const { amount, userAddress, channelId = 0 } = params;
  
      try {
        await this.validateStakingInputs(amount, userAddress);
        const exchangeRate = await this.getExchangeRate();
        const expectedVDot = this.calculateExpectedVDot(amount, exchangeRate);
        const fees = await this.calculateStakingFees(amount);
  
        const result = await this.builder
          .addStaking(amount, channelId)
          .execute(signer);
  
        if (result.success) {
          const actualVDot = this.parseVDotMintedFromEvents(result.events);
          return {
            success: true,
            transactionHash: result.transactionHash,
            expectedVDot,
            actualVDot,
            fees,
            exchangeRate,
          };
        } else {
          return {
            success: false,
            transactionHash: result.transactionHash,
            error: result.error,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    }
  
    async validateStakingInputs(amount, userAddress) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid staking amount");
      }
  
      const minStakeAmount = 1;
      if (amountNum < minStakeAmount) {
        throw new Error(`Minimum staking amount is ${minStakeAmount} DOT`);
      }
  
      const balance = await this.getUserBalance(userAddress, "DOT");
      const balanceNum = parseFloat(balance);
  
      if (balanceNum < amountNum) {
        throw new Error("Insufficient DOT balance");
      }
  
      const reserveAmount = 0.1;
      if (balanceNum - amountNum < reserveAmount) {
        throw new Error("Insufficient balance for transaction fees");
      }
    }
  
    calculateExpectedVDot(dotAmount, exchangeRate) {
      const dotNum = parseFloat(dotAmount);
      const expectedVDot = dotNum / exchangeRate;
      return expectedVDot.toFixed(6);
    }
  
    async calculateStakingFees(amount) {
      const networkFee = await this.estimateNetworkFee("staking");
      return {
        networkFee: networkFee.toString(),
        protocolFee: "0",
        totalFee: networkFee.toString(),
      };
    }
  
    parseVDotMintedFromEvents(events) {
      const mintedEvent = events.find(
        (e) => e.name === "txBestChainBlockIncluded" && e.payload.event.name === "slp.Minted"
      );
  
      if (mintedEvent) {
        const [currencyId, , amount] = mintedEvent.payload.event.data;
        if (currencyId.type === "VToken" && currencyId.value === "DOT") {
          return amount.toString();
        }
      }
      return "0";
    }
  
    async getExchangeRate() {
      const rate = await this.api.query.slp.exchangeRate.getValue({ VToken: "DOT" });
      return parseFloat(rate.toString()) / 1e18;
    }
  
    async getUserBalance(address, token) {
      const currencyId = { Token: token };
      const balance = await this.api.query.tokens.accounts.getValue(address, currencyId);
      return balance.free.toString();
    }
  
    async estimateNetworkFee(txType) {
      const baseFee = 0.01;
      const multiplier = txType === "staking" ? 1.2 : 1.0;
      return baseFee * multiplier;
    }
}


async function main() {
    let client = createClient(BIFROST_RPC);




}