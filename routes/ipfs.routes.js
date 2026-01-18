import express from "express";
import fetch from "node-fetch";
import FormData from "form-data";

const router = express.Router();

router.post("/upload-ipfs", async (req, res) => {
  try {
    const { fileBase64, filename } = req.body;

    const buffer = Buffer.from(fileBase64, "base64");

    const form = new FormData();
    form.append("file", buffer, filename);

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`
      },
      body: form
    });

    const data = await pinataRes.json();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "IPFS upload failed" });
  }
});

export default router;
