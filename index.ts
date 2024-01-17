import dotenv from "dotenv"
import { UserOperation, bundlerActions, getSenderAddress, signUserOperationHashWithECDSA } from "permissionless"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { Hex, concat, createClient, createPublicClient, encodeFunctionData, http } from "viem"
import { mnemonicToAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { ethers, Contract } from 'ethers';
import { mainnet } from "viem/chains"
import entrypoint from './abis/entrypoint.json'
import { UserOperationType } from './api-test/apitype'
import { estimateUserOperationGas, paymasterSponsorUserOperation } from './api-test/testbundlerTool'

dotenv.config()


/** API TEST */
const param : UserOperationType = {};

param.sender = "0xab45138261Dc6f3416B1820F58A757cD088009Ed";
param.nonce = "0x0";
param.initCode = "0xFd877542A65fA9c1403E1e6F99BBf3629f657Cfa0fd8377b0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000401322286a74e54b39c2d18b7abe209541c2b0e1ca5793833247821b45573fc0266200d5e2b37f393c1e69eda6830f39c219fcb673101fbeda4748442e1e00edd2";
param.callData = "0xb61d27f6000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa9604500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000";
param.callGasLimit = "0x560c";
param.verificationGasLimit = "0x98129";
param.preVerificationGas = "0xc034";
param.maxFeePerGas = "0x656703D00";
param.maxPriorityFeePerGas = "0x13AB6680";
param.paymasterAndData = "0x";
param.signature = "0x89f201864b89cb77b9efc64247303031e655aaa977e13d525ad94a4a4cc233853fadf0a7dc2c2e55c1c3a4d93a36afe58941c714bc4f0a4d35d391292d6a8f7e1b";

const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
const entrypointContract = new Contract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", entrypoint.abi, provider);

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



// // Local Node  등록
// const publicClient = createPublicClient({
//     transport: http("http://127.0.0.1:8545"),
//     chain: mainnet
// })
// const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
// const entrypointContract = new Contract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", entrypoint.abi, provider);


// // GENERATE THE INITCODE
// const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0xFd877542A65fA9c1403E1e6F99BBf3629f657Cfa"
// const Q = ["0x1322286a74e54b39c2d18b7abe209541c2b0e1ca5793833247821b45573fc026", "0x6200d5e2b37f393c1e69eda6830f39c219fcb673101fbeda4748442e1e00edd2"]
// const encodePubkCoordinates = ethers.utils.defaultAbiCoder.encode(
//     ["uint256[2]"],
//     [
//         Q
//     ],
//   )

// console.log("encodePubkCoordinates", encodePubkCoordinates)


// // bytes1 authenticatorDataFlagMask,
// // bytes memory authenticatorData,
// // bytes memory clientData,
// // bytes memory clientChallenge,
// // uint256 clientChallengeOffset,
// // uint256[2] memory rs

// // const dummydata = ethers.utils.defaultAbiCoder.encode(
// //     ["bytes1", "bytes", "bytes", "bytes", "uint256", "uint256[2]", "uint256[2]"],
// //     [
// //         "0x05",
// //         "0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000",
// //         "0x7b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a227a4c5f6d674c314a32546e6a43415449776b76467a5861596d6c3855356d73644a5365664a4668724a3477222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a33303030222c2263726f73734f726967696e223a66616c73657d",
// //         "0xccbfe680bd49d939e30804c8c24bc5cd76989a5f14e66b1d25279f24586b278c",
// //         "36",
// //         ["0x9b0a3397f24677f039e5c96a937f1c94a4e5e19acd814d2ac1eb386e3a926909", "0x591ea7ffad59ac0448094c15816bbd3a2129dcb689b4511fbf48aa96ad3ea1c3"],
// //         ["0xf8fb00bd6e1c5f399e39c0db7deaa8049040f3fcf07eae4ec4f6ccc76f90386c", "0xd2728f856da05c444ca8ba77bc5fb4b1618d56f627c4aa203af8ef2f226cc288"]
// //     ],
// // )

// // console.log("dummydata", dummydata)


// /** = = = = = = = = = = = = = = = = = = = = = = =  */

// // 팩토리 패턴을 통한 월렛 생성 코드 
// const initCode = concat([
//     SIMPLE_ACCOUNT_FACTORY_ADDRESS,
//     encodeFunctionData({
//       abi: [{
//         inputs: [
//           { name: "anPubkCoordinates", type: "bytes" }, 
//           { name: "salt", type: "uint256" }],
//         name: "createAccount",
//         outputs: [{ name: "ret", type: "address" }],
//         stateMutability: "nonpayable",
//         type: "function",
//       }],
//       args: [encodePubkCoordinates as `0x${string}`, BigInt(0)]
//     })
//   ]);

// console.log("Generated initCode:", initCode)

// // create2 결정론적인 주소 생성
// const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

// const senderAddress = await getSenderAddress(publicClient, {
//     initCode,
//     entryPoint: ENTRY_POINT_ADDRESS
// })
// console.log("Calculated sender address:", senderAddress)

// // /** =========================================================== */

// // 결정론 적인 주소를 통해, 비탈릭에게 메시지 전송 트랜잭션 생성
// const to = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" // vitalik
// const value = 0n
// const data = "0x68656c6c6f" // "hello" encoded to utf-8 bytes

// const callData = encodeFunctionData({
//     abi: [
//         {
//             inputs: [
//                 { name: "dest", type: "address" },
//                 { name: "value", type: "uint256" },
//                 { name: "func", type: "bytes" }
//             ],
//             name: "execute",
//             outputs: [],
//             stateMutability: "nonpayable",
//             type: "function"
//         }
//     ],
//     args: [to, value, data]
// })

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

//paymaster 호출하기1
//bundler 호출하기




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