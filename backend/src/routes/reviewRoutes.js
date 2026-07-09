const router = require("express").Router();
const { updateReview, deleteReview } = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;
