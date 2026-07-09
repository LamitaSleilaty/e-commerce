const router = require("express").Router();
const { register, login, me, verifyEmail, resendVerification } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", authenticate, me);

module.exports = router;
