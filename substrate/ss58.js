import { decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';

function ss58ToPublicKey(ss58Address) {
  try {
    // Decode SS58 to raw 32-byte Uint8Array (validates prefix and checksum)
    const publicKeyBytes = decodeAddress(ss58Address);
    
    // Convert to hex string (0x-prefixed)
    const publicKeyHex = u8aToHex(publicKeyBytes);
    
    return publicKeyHex;
  } catch (error) {
    throw new Error(`Invalid SS58 address: ${error.message}`);
  }
}

// Usage
const ss58Address = "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY";
 // Alice's dev SS58 (prefix 42 for local)
const ss58 = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
const publicKey = ss58ToPublicKey(ss58);
console.log("Public key (hex):", publicKey);
// Output: Public key (hex): 0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d