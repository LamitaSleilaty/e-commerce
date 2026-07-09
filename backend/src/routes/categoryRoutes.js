const router = require("express").Router();
const { listCategories, createCategory } = require("../controllers/categoryController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", listCategories);
router.post("/", authenticate, requireRole("ADMIN"), createCategory);

module.exports = router;
