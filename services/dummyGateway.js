import DummyWallet from "../models/DummyWallet.js";
import crypto from "crypto";

export async function processDummyPayout(investorId, amount, reference) {

  let wallet = await DummyWallet.findOne({ ownerId: investorId });

  if (!wallet) {
    wallet = new DummyWallet({
      ownerId: investorId,
      balance: 0,
      transactions: []
    });
  }

  const txId = "MV_TX_" + crypto.randomBytes(8).toString("hex");

  wallet.balance += amount;

  // OLD SIMPLE FORMAT – store as string
  wallet.transactions.push(
    `${txId} | CREDIT | ₹${amount} | ${reference}`
  );

  await wallet.save();

  return {
    success: true,
    transactionId: txId,
    newBalance: wallet.balance
  };
}
