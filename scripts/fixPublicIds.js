import mongoose from "mongoose";
import Investor from "../models/Investor.js";
import { generatePublicId } from "../utils/generatePublicId.js";

await mongoose.connect("mongodb://127.0.0.1:27017/metavault");

const investors = await Investor.find({ publicId: { $exists: false } });

for (const inv of investors) {
  inv.publicId = generatePublicId();
  await inv.save();
  console.log("Fixed:", inv._id.toString(), "→", inv.publicId);
}

console.log("Done");
process.exit();
