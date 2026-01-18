import mongoose from "mongoose";

const bondSchema = new mongoose.Schema({
  bondName: String,
  issuerId: String,
  issuerName: String,

  faceValue: Number,
  expectedReturnRate: Number,
  minContribution: Number,

  ipfsHash: String,
  onChainHash: String,

  status: { type: String, default: "TOKENIZED" },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Bond", bondSchema);
