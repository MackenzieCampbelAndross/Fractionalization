import express from "express";
import fetch from "node-fetch";
import FormData from "form-data";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { fileBase64, filename, localHash } = req.body;

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

    const ipfs = await pinataRes.json();
    if (!ipfs.IpfsHash) throw new Error("Pinata failed");

    // TODO: optionally store hash & CID in DB

    res.json({
      cid: ipfs.IpfsHash,
      txHash: localHash   // using local hash for demo tx
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default router;
