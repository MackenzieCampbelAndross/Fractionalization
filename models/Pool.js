import mongoose from "mongoose";

const ownershipSchema = new mongoose.Schema({
  contributorPublicId: String,
  amount: Number,
  percentage: Number
}, { _id: false });

const payoutSchema = new mongoose.Schema({
  contributor: String,
  principal: Number,
  interest: Number,
  total: Number,
  claimed: { type: Boolean, default: false }
}, { _id: false });

const poolSchema = new mongoose.Schema({

  // On-chain reference
  bondId: {
    type: Number,
    unique: true,
    sparse: true
  },

  bondName: { type: String },

  issuerId: { type: String },
  issuerName: { type: String },

  expectedReturnRate: { type: Number },

  targetAmount: { type: Number },
  currentAmount: { type: Number, default: 0 },

  minContribution: { type: Number, default: 100 },

  state: {
    type: String,
    enum: ["DRAFT", "OPEN", "FULL", "MATURED", "CLOSED"],
    default: "DRAFT",
    index: true
  },

  maturityDate: { type: Date },

  // Metadata
  cid: { type: String },
  localHash: { type: String },

  // Investment tracking
  ownershipSnapshot: [ownershipSchema],

  // Payout tracking after maturity
  payouts: [payoutSchema],

  // To avoid double on-chain deposits
  yieldDeposited: {
    type: Boolean,
    default: false
  },

  createdAt: { type: Date, default: Date.now }

});

export default mongoose.model("Pool", poolSchema);
