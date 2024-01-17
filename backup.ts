import dotenv from "dotenv"
import { UserOperation, bundlerActions, getSenderAddress, signUserOperationHashWithECDSA } from "permissionless"
import { pimlicoBundlerActions, pimlicoPaymasterActions } from "permissionless/actions/pimlico"
import { Hex, concat, createClient, createPublicClient, encodeFunctionData, http } from "viem"
import { mnemonicToAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { ethers, Contract } from 'ethers';
import { mainnet } from "viem/chains"
import entrypoint from './abis/entrypoint.json'
dotenv.config()

// Local Node  등록
const publicClient = createPublicClient({
    transport: http("http://127.0.0.1:8545"),
    chain: mainnet
})
const provider = new ethers.providers.StaticJsonRpcProvider("http://127.0.0.1:8545");
const entrypointContract = new Contract("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", entrypoint.abi, provider);


// GENERATE THE INITCODE
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0xE35A694bDD65186854CF6f72BA5fA81F35D70757"
const Q = ["0x1322286a74e54b39c2d18b7abe209541c2b0e1ca5793833247821b45573fc026", "0x6200d5e2b37f393c1e69eda6830f39c219fcb673101fbeda4748442e1e00edd2"]
const pubk = "0xcad22e8e4e41397f03fd9500340fe7cc5843ecb736d2f16b2c4e8aef19bbf295"

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
          { name: "owner", type: "bytes" }, 
          { name: "salt", type: "uint256" },
          { name: "anPubkCoordinates", type: "bytes" }],
        name: "createAccount",
        outputs: [{ name: "ret", type: "address" }],
        stateMutability: "nonpayable",
        type: "function",
      }],
      args: [pubk as `0x${string}`, BigInt(0), encodePubkCoordinates as `0x${string}`]
    })
  ]);

console.log("Generated initCode:", initCode)

// create2 결정론적인 주소 생성
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

const senderAddress = await getSenderAddress(publicClient, {
    initCode,
    entryPoint: ENTRY_POINT_ADDRESS
})
console.log("Calculated sender address:", senderAddress)

// /** =========================================================== */

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

console.log("Generated callData:", callData)

// 유저 오퍼레이션 생성
const userOperation: UserOperation = {
    sender: senderAddress,
    nonce: 0n,
    initCode,
    callData,
    callGasLimit: BigInt("0x560c"), // 실행 gas 할당할 량
    verificationGasLimit: BigInt("0x5e1a2"), // 검증 gas 할당할 량
    preVerificationGas: BigInt("0xb02c"), // bundler에게 보상 지불할 가스 량
    maxFeePerGas: BigInt("0x656703D00"), // 허용할 가스 최대 가격
    maxPriorityFeePerGas: BigInt("0x13AB6680"), // bundler에게 지불하는 최대 팁
    paymasterAndData:"0x",
    signature: "0xa15569dd8f8324dbeabf8073fdec36d4b754f53ce5901e283c6de79af177dc94557fa3c9922cd7af2a96ca94402d35c39f266925ee6407aeb32b31d76978d4ba1c"
}

// 해당 해쉬 값을 signature로 요청한다.
const userOpHash = await entrypointContract.getUserOpHash(userOperation);
console.log(userOpHash)

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