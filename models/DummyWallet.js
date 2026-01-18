import mongoose from "mongoose";

const DummyWalletSchema = new mongoose.Schema({
  ownerId: String,
  balance: Number,
  transactions: [String]
});

export default mongoose.model("DummyWallet", DummyWalletSchema);
