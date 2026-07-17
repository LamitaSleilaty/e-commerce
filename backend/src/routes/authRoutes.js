const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { register, login, me, verifyEmail, resendVerification } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", authLimiter, resendVerification);
router.get("/me", authenticate, me);

module.exports = router;
