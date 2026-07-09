const router = require("express").Router();
const { chat, recommendations, compare, generateDescription } = require("../controllers/aiController");
const { authenticate, requireRole } = require("../middleware/auth");

router.post("/chat", authenticate, chat);
router.get("/recommendations", authenticate, recommendations);
router.post("/compare", authenticate, compare);
router.post("/generate-description", authenticate, requireRole("ADMIN"), generateDescription);

module.exports = router;
