const express = require("express");
const router = express.Router();
const MBTIController = require("../controller/MBTIController");
const { verifyAdmin } = require("../middleware/Auth");

// Public routes (accessible to anyone)
router.get("/questions", MBTIController.getAllQuestions);

// Admin routes (require admin authentication)
router.post("/questions", verifyAdmin, MBTIController.addQuestion);
router.put("/questions/:id", verifyAdmin, MBTIController.updateQuestion);
router.delete("/questions/:id", verifyAdmin, MBTIController.deleteQuestion);

module.exports = router;
