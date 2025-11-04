const express = require("express");
const router = express.Router();
const UserController = require("../controller/UserController");
const { verifyUser } = require("../middleware/Auth");

router.post("/signup", UserController.signup);
router.post("/login", UserController.login);
router.post("/forgot-password", UserController.forgotPassword);
router.post("/reset-password/:token", UserController.resetPassword);

router.use(verifyUser);

router.get("/profile", UserController.getProfile);
router.put("/profile", UserController.updateProfile);
router.put("/update-password", UserController.updatePassword);
router.get("/mbti-results", UserController.getUserMBTIResults);
router.get("/perma-results", UserController.getUserPERMAResults);

module.exports = router;
