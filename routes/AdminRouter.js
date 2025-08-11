const express = require("express");
const router = express.Router();
const AdminController = require("../controller/AdminControlelr");
const { verifyAdmin } = require("../middleware/Auth");

router.post("/login", AdminController.loginAdmin);
router.post("/signup", AdminController.signupAdmin);

router.use(verifyAdmin);

router.get("/profile", AdminController.getAdminProfile);

router.get("/logs", AdminController.getAdminLogs);

router.get("/dashboard-stats", AdminController.getDashboardStats);

module.exports = router;
