import mongoose from "mongoose";

const poolSchema = new mongoose.Schema({
  name: String,
  targetAmount: Number,
  currentAmount: { type: Number, default: 0 },
  status: { type: String, default: "OPEN" }, // OPEN → SEALED → MATURED
  maturesAt: Date
}, { timestamps: true });

export default mongoose.model("Pool", poolSchema);
