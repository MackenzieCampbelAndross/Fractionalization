import mongoose from "mongoose";

const settlementSchema = new mongoose.Schema({
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
  investorId: { type: String, required: true },
  amount: { type: Number, required: true },
  txHash: { type: String, required: true },
  bondAddress: { type: String, required: true },
  executedAt: { type: Date, default: Date.now }
});

export default mongoose.model("Settlement", settlementSchema);
