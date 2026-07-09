const router = require("express").Router();
const { checkout, listOrders, listAllOrders, getOrder, updateOrderStatus } = require("../controllers/orderController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);
router.post("/checkout", checkout);
router.get("/", listOrders);
router.get("/admin/all", requireRole("ADMIN"), listAllOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", requireRole("ADMIN"), updateOrderStatus);

module.exports = router;
