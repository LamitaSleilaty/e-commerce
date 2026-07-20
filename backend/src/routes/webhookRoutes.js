const crypto = require("crypto");
const router = require("express").Router();
const { getAbandonedCarts, getLowStockProducts } = require("../controllers/webhookController");


function verifyN8nSecret(req, res, next) {
  const signature = req.headers["x-n8n-signature"];
  const expected = process.env.N8N_API_KEY;

  if (!expected || typeof signature !== "string") {
    return res.status(401).json({ error: "Invalid or missing n8n signature" });
  }

  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  const valid =
    signatureBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(signatureBuf, expectedBuf);

  if (!valid) {
    return res.status(401).json({ error: "Invalid or missing n8n signature" });
  }
  next();
}

router.use(verifyN8nSecret);
router.get("/abandoned-carts", getAbandonedCarts);
router.get("/low-stock", getLowStockProducts);

module.exports = router;
