import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ─── ENV must load FIRST ───
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.join(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import nodemailer from "nodemailer";
import { ethers } from "ethers";

// ─── Import routes AFTER env is ready ───
import bondRoutes from "./routes/bond.routes.js";
import poolRoutes from "./routes/pool.routes.js";
import investmentRoutes from "./routes/investment.routes.js";
import investorRoutes from "./routes/investor.routes.js";
import claimRoutes from "./routes/claim.routes.js";
import payoutRoutes from "./routes/payout.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import orgRoutes from "./routes/org.routes.js";
import settlementRoutes from "./routes/settlement.routes.js";
import ipfsRoutes from "./routes/ipfs.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import yieldRoutes from "./routes/yield.routes.js";
import storeKycRoutes from "./routes/storeKyc.routes.js";
import walletRoutes from "./routes/wallet.routes.js";

import { processMaturedPools } from "./services/maturity.service.js";

const app = express();

// ────────────── BLOCKCHAIN ENV VALIDATION ──────────────

// Ensure contract address is present
if (!process.env.BOND_CONTRACT_ADDRESS) {
  console.error("❌ Missing BOND_CONTRACT_ADDRESS in .env");
  process.exit(1);
}

console.log("Using bond contract:", process.env.BOND_CONTRACT_ADDRESS);

// Optional sanity check for valid Ethereum address
if (!ethers.isAddress(process.env.BOND_CONTRACT_ADDRESS)) {
  console.error("❌ Invalid Ethereum contract address in .env");
  process.exit(1);
}

// ────────────── MIDDLEWARE ──────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ────────────── DATABASE ──────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    console.log("Connected DB:", mongoose.connection.name);
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// ────────────── ROUTES ──────────────
app.use("/api/bonds", bondRoutes);
app.use("/api/pool", poolRoutes);
app.use("/api/investment", investmentRoutes);
app.use("/api/investor", investorRoutes);
app.use("/api/claim", claimRoutes);
app.use("/api/payout", payoutRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/org", orgRoutes);
app.use("/api/settlement", settlementRoutes);
app.use("/api", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/yield", yieldRoutes);
app.use("/api/store-kyc", storeKycRoutes);
app.use("/api/wallet", walletRoutes);

// ────────────── MATURITY ENGINE ──────────────
setInterval(async () => {
  try {
    await processMaturedPools();
  } catch (err) {
    console.error("Maturity Engine Error:", err);
  }
}, 5000);

// ────────────── OTP AUTH SYSTEM ──────────────
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

app.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email required" });

  const code = generateOtp();

  otpStore[email] = {
    code,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await transporter.sendMail({
      from: `"MetaVault" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your MetaVault OTP",
      text: `Your OTP is ${code}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("OTP Email Error:", err);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
});

app.post("/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const entry = otpStore[email];

  if (!entry || Date.now() > entry.expiresAt || otp !== entry.code)
    return res.status(400).json({ error: "Invalid or expired OTP" });

  delete otpStore[email];

  res.json({ success: true });
});

// ────────────── START SERVER ──────────────
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
