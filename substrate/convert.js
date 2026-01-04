import { keccak256 } from "ethers";

/**
 * Convert a 32-byte Substrate account address to an EVM address
 * This mirrors the Rust implementation:
 * let account_hash = keccak_256(account_bytes);
 * H160::from_slice(&account_hash[12..])
 * 
 * @param {string} substrateAccount - The 32-byte Substrate account (with or without 0x prefix)
 * @returns {string} The corresponding EVM address
 */
function convertSubstrateToEVM(substrateAccount) {
    // Remove 0x prefix if present
    const cleanHex = substrateAccount.startsWith('0x') ? substrateAccount.slice(2) : substrateAccount;
    
    // Validate that it's a 32-byte (64 hex characters) address
    if (cleanHex.length !== 64) {
        throw new Error(`Invalid Substrate account: expected 64 hex characters, got ${cleanHex.length}`);
    }
    
    // Apply Keccak-256 hash to the account bytes
    const accountHash = keccak256('0x' + cleanHex);
    
    // Extract the last 20 bytes (40 hex characters) from the 32-byte hash
    // This corresponds to account_hash[12..] in the Rust implementation
    const evmAddress = '0x' + accountHash.slice(26); // Remove '0x' prefix and take last 40 chars
    
    return evmAddress;
}

// Test with the provided example
const substrateAccount = "0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d";
const evmAddress = convertSubstrateToEVM(substrateAccount);

console.log("Substrate Account:", substrateAccount);
console.log("EVM Address:", evmAddress);

// Export the function for use in other modules
export { convertSubstrateToEVM };
