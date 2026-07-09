const router = require("express").Router();
const { getAbandonedCarts, getLowStockProducts } = require("../controllers/webhookController");

// Shared-secret check for inbound calls from n8n (n8n pulls data via these GET endpoints)
function verifyN8nSecret(req, res, next) {
  const signature = req.headers["x-n8n-signature"];
  if (!process.env.N8N_API_KEY || signature !== process.env.N8N_API_KEY) {
    return res.status(401).json({ error: "Invalid or missing n8n signature" });
  }
  next();
}

router.use(verifyN8nSecret);
router.get("/abandoned-carts", getAbandonedCarts);
router.get("/low-stock", getLowStockProducts);

module.exports = router;
