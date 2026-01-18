import express from "express";
import { storeKycController } from "../controllers/storeKyc.controller.js";

const router = express.Router();

router.post("/", storeKycController);

export default router;
