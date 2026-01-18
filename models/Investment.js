import mongoose from "mongoose";
import Investor from "../models/Investor.js";

const investmentSchema = new mongoose.Schema({
  investorId: { type: mongoose.Schema.Types.ObjectId, ref: "Investor" },
  poolId: { type: mongoose.Schema.Types.ObjectId, ref: "Pool" },
  amount: Number,
  ownershipPercent: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Investment", investmentSchema);
