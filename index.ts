import dotenv from "dotenv"
import { Hex, concat, createClient, createPublicClient, encodeFunctionData, http } from "viem"
import { ethers, Contract } from 'ethers';
import entrypoint from './abis/entrypoint.json'
import FIDOAccountFactory2 from './abis/FIDOAccountFactory2.json'

import { UserOperationType } from './api-test/apitype'
import { estimateUserOperationGas, paymasterSponsorUserOperation } from './api-test/testbundlerTool'

dotenv.config()

const entryPointAddress = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x6CbBC50E6CC72C00D81a8389eB11455dBd786144"
const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");


const entrypointContract = new Contract(entryPointAddress, entrypoint.abi, provider);
console.log(entrypointContract)
const factoryContract = new Contract(SIMPLE_ACCOUNT_FACTORY_ADDRESS, FIDOAccountFactory2.abi, provider);

/** Param Start */
const param : UserOperationType = {};

// GENERATE THE INITCODE
const Q = ["0x1322286a74e54b39c2d18b7abe209541c2b0e1ca5793833247821b45573fc026", "0x6200d5e2b37f393c1e69eda6830f39c219fcb673101fbeda4748442e1e00edd2"]
const encodePubkCoordinates = ethers.utils.defaultAbiCoder.encode(
    ["uint256[2]"],
    [
        Q
    ],
  )
console.log("encodePubkCoordinates", encodePubkCoordinates)

// 팩토리 패턴을 통한 월렛 생성 코드 
const initCode = concat([
    SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    encodeFunctionData({
      abi: [{
        inputs: [
          { name: "anPubkCoordinates", type: "bytes" }, 
          { name: "salt", type: "uint256" }],
        name: "createAccount",
        outputs: [{ name: "ret", type: "address" }],
        stateMutability: "nonpayable",
        type: "function",
      }],
      args: [encodePubkCoordinates as `0x${string}`, BigInt(0)]
    })
  ]);

// create2 결정론적인 주소 생성
const senderAddress = await factoryContract.getAddress(encodePubkCoordinates, 0)
console.log("Calculated sender address:", senderAddress)

// 결정론 적인 주소를 통해, 비탈릭에게 메시지 전송 트랜잭션 생성
const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik
const value = 0n
const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes

const callData = encodeFunctionData({
    abi: [
        {
            inputs: [
                { name: "dest", type: "address" },
                { name: "value", type: "uint256" },
                { name: "func", type: "bytes" }
            ],
            name: "execute",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        }
    ],
    args: [to, value, data]
})


param.sender = senderAddress;
param.nonce = "0x0";
param.initCode = initCode;
param.callData = callData;
param.callGasLimit = "0x560c";
param.verificationGasLimit = "0x98129";
param.preVerificationGas = "0xc034";
param.maxFeePerGas = "0x656703D00";
param.maxPriorityFeePerGas = "0x13AB6680";
param.paymasterAndData = "0x";
param.signature = "0x";


// paymaster 등록을 먼저 한다.
const paymaster_result_param = await paymasterSponsorUserOperation(param)
console.log("paymaster_result_param===", paymaster_result_param)

param.paymasterAndData = paymaster_result_param.result

console.log(param)

// bundler 가스 추정치를 업데이트 한다.
const bunder_result_param = await estimateUserOperationGas(param);
console.log("bunder_result_param===", bunder_result_param)

param.callGasLimit = bunder_result_param.result.callGasLimit
param.verificationGasLimit = bunder_result_param.result.verificationGasLimit
param.preVerificationGas = bunder_result_param.result.preVerificationGas

console.log(param)

const userOpHash = await entrypointContract.getUserOpHash(param);
console.log(userOpHash)

//이제 해당 hash를 fido로 서명한다.


// // /** =========================================================== */


// console.log("Generated callData:", callData)

// // 유저 오퍼레이션 생성
// const userOperation: UserOperation = {
//     sender: senderAddress,
//     nonce: 0n,
//     initCode,
//     callData,
//     callGasLimit: BigInt("0x560c"), // 실행 gas 할당할 량
//     verificationGasLimit: BigInt("0x98129"), // 검증 gas 할당할 량
//     preVerificationGas: BigInt("0xc034"), // bundler에게 보상 지불할 가스 량
//     maxFeePerGas: BigInt("0x656703D00"), // 허용할 가스 최대 가격
//     maxPriorityFeePerGas: BigInt("0x13AB6680"), // bundler에게 지불하는 최대 팁
//     paymasterAndData:"0x",
//     signature: "0x"
// }

// // 해당 해쉬 값을 signature로 요청한다.
// const userOpHash = await entrypointContract.getUserOpHash(userOperation);
// console.log(userOpHash)
// console.log(userOperation)

/** = = = = = = = = = = = = = = = = = = = = = = =  */





// // 유저 오퍼레이션 서명
// const signature = await signUserOperationHashWithECDSA({
//     account: account,
//     userOperation: userOperation,
//     chainId: 1337,
//     entryPoint: ENTRY_POINT_ADDRESS
// })

// console.log(signature)
// userOperation.signature = signature
// console.log(userOperation)


// // REQUEST PIMLICO VERIFYING PAYMASTER SPONSORSHIP
// const sponsorUserOperationResult = await paymasterClient.sponsorUserOperation({
//     userOperation,
//     entryPoint: ENTRY_POINT_ADDRESS
// })

// const sponsoredUserOperation: UserOperation = {
//     ...userOperation,
//     preVerificationGas: sponsorUserOperationResult.preVerificationGas,
//     verificationGasLimit: sponsorUserOperationResult.verificationGasLimit,
//     callGasLimit: sponsorUserOperationResult.callGasLimit,
//     paymasterAndData: sponsorUserOperationResult.paymasterAndData
// }

// console.log("Received paymaster sponsor result:", sponsorUserOperationResult)

// // SIGN THE USER OPERATION
// const signature = await signUserOperationHashWithECDSA({
//     account: owner,
//     userOperation: sponsoredUserOperation,
//     chainId: lineaTestnet.id,
//     entryPoint: ENTRY_POINT_ADDRESS
// })
// sponsoredUserOperation.signature = signature

// console.log("Generated signature:", signature)

// // SUBMIT THE USER OPERATION TO BE BUNDLED
// const userOperationHash = await bundlerClient.sendUserOperation({
//     userOperation: sponsoredUserOperation,
//     entryPoint: ENTRY_POINT_ADDRESS
// })

// console.log("Received User Operation hash:", userOperationHash)

// // let's also wait for the userOperation to be included, by continually querying for the receipts
// console.log("Querying for receipts...")
// const receipt = await bundlerClient.waitForUserOperationReceipt({ hash: userOperationHash })
// const txHash = receipt.receipt.transactionHash

// console.log(`UserOperation included: https://goerli.lineascan.build/tx/${txHash}`)