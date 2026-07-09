const router = require("express").Router();
const { listAddresses, createAddress, deleteAddress } = require("../controllers/addressController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/", listAddresses);
router.post("/", createAddress);
router.delete("/:id", deleteAddress);

module.exports = router;