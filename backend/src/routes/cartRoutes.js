const router = require("express").Router();
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/", getCart);
router.post("/items", addItem);
router.put("/items/:itemId", updateItem);
router.delete("/items/:itemId", removeItem);

module.exports = router;
