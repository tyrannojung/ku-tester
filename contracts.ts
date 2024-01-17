import { ethers, Contract } from 'ethers';
import entrypoint from './abis/entrypoint.json'

const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
const entrypointContract = new Contract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", entrypoint.abi, provider);