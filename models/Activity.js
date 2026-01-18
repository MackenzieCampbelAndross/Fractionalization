import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  investorId: String,
  type: String,
  poolId: String,
  description: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Activity", activitySchema);
