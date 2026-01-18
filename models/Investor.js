import mongoose from "mongoose";

const InvestorSchema = new mongoose.Schema({
  authId: { type: String, unique: true },
  email: String,

  publicId: { type: String, unique: true },

  firstName: String,
  lastName: String,
  age: Number,
  gender: String,

  address: String,
  city: String,
  state: String,
  country: String,
  phone: String,

  profileCompleted: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Investor", InvestorSchema);
