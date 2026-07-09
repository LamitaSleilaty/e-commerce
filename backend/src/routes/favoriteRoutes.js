const router = require("express").Router();
const { listFavorites, addFavorite, removeFavorite } = require("../controllers/favoriteController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/", listFavorites);
router.post("/", addFavorite);
router.delete("/:productId", removeFavorite);

module.exports = router;
