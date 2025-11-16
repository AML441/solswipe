import { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

export async function simulateTransaction(
  connection: Connection,
  senderPublicKey: string, 
  recipientAddress: string, 
  amount: number
) {
  try {
    // Try creating public keys
    let senderPublicKeyObj: PublicKey;
    let recipientPublicKey: PublicKey;
    
    try {
      senderPublicKeyObj = new PublicKey(senderPublicKey);
      console.log('Sender public key created:', senderPublicKeyObj.toBase58());
    } catch (err) {
      console.error('Invalid sender address:', err);
      throw new Error('Invalid sender address');
    }
    
    try {
      recipientPublicKey = new PublicKey(recipientAddress);
      console.log('Recipient public key created:', recipientPublicKey.toBase58());
    } catch (err) {
      console.error('Invalid recipient address:', err);
      throw new Error('Invalid recipient address');
    }

    // Validate addresses are on curve
    try {
      if (!PublicKey.isOnCurve(senderPublicKeyObj.toBytes())) {
        throw new Error('Sender address not on curve');
      }
      console.log('Sender address is on curve');
    } catch (err) {
      console.error('Sender validation failed:', err);
      throw new Error('Invalid sender address');
    }
    
    try {
      if (!PublicKey.isOnCurve(recipientPublicKey.toBytes())) {
        throw new Error('Recipient address not on curve');
      }
      console.log('Recipient address is on curve');
    } catch (err) {
      console.error('Recipient validation failed:', err);
      throw new Error('Invalid recipient address');
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create the transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: senderPublicKeyObj,
      toPubkey: recipientPublicKey,
      lamports: Math.floor(amount * LAMPORTS_PER_SOL),
    });

    // Create transaction
    const transaction = new Transaction();
    transaction.add(transferInstruction);
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKeyObj;

    // Simulate the transaction
    const simulationResult = await connection.simulateTransaction(transaction);

    if (simulationResult.value.err) {
      throw new Error(`Transaction would fail: ${JSON.stringify(simulationResult.value.err)}`);
    }

    return {
      success: true,
      details: `Successfully simulated: ${amount} SOL to ${recipientPublicKey.toBase58().slice(0, 8)}...`,
      logs: simulationResult.value.logs || [],
      unitsConsumed: simulationResult.value.unitsConsumed || 0,
    };
  } catch (error: unknown) {
    console.error('Full simulation error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'Unknown error during simulation',
    };
  }
}