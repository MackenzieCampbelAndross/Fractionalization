import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema({
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool" },
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: "Investor" },
  investedAmount: Number,   // cents
  shareBps: Number,         // basis points
  claimedAmount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Ownership", ownershipSchema);
