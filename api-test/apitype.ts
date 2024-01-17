export interface UserOperationType {
    sender?: string;
    nonce?: string;
    initCode?: string;
    callData?: string;
    callGasLimit?: string;
    verificationGasLimit?: string;
    preVerificationGas?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    paymasterAndData?: string;
    signature?: string;
}