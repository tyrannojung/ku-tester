import { ethers } from 'ethers';

function generateFunctionSignature(functionSignature: any) {
    // generate function signature hash, utils.id uses keccak256
    const functionSignatureHash = ethers.utils.id(functionSignature).slice(0, 10);
  
    // output results
    console.log(`Function: ${functionSignature}`);
    console.log(`Function signature: ${functionSignatureHash}`);
  
    return functionSignatureHash;
}

//console.log(generateFunctionSignature("deposit()"))


// Function signature for `getDepositInfo(address)`
const functionSignature = generateFunctionSignature('getDepositInfo(address)');

// Address to query
const address = '0x5E398a03E818fD1a7596861b751Fb2D0E7d74c5D';

// Initialize an instance of Interface with the function signature
const contractInterface = new ethers.utils.Interface([functionSignature]);

// Encode the function call with the address parameter
const data = contractInterface.encodeFunctionData(functionSignature, [address]);

console.log(data);