const router = require("express").Router();
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { createReview } = require("../controllers/reviewController");
const { authenticate, requireRole } = require("../middleware/auth");

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", authenticate, requireRole("ADMIN"), createProduct);
router.put("/:id", authenticate, requireRole("ADMIN"), updateProduct);
router.delete("/:id", authenticate, requireRole("ADMIN"), deleteProduct);
router.post("/:id/reviews", authenticate, createReview);

module.exports = router;
