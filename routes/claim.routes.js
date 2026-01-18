import express from "express";
import { claimYield } from "../controllers/claim.controller.js";

const router = express.Router();

// POST /api/claim/:poolId/claim
router.post("/:poolId/claim", claimYield);

export default router;
