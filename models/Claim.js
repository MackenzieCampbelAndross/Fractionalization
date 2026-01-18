import mongoose from "mongoose";

const claimSchema = new mongoose.Schema({
  investorId: String,
  poolId: String,
  share: Number,
  createdAt: { type: Date, default: Date.now },
  paid: { type: Boolean, default: false }
});

export default mongoose.model("Claim", claimSchema);
