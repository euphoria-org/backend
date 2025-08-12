const express = require("express");
const router = express.Router();
const MBTIController = require("../controller/MBTIController");
const { verifyAdmin, verifyUser } = require("../middleware/Auth");

// Public routes (accessible to anyone)
router.get("/questions", MBTIController.getAllQuestions);

// User routes (require user authentication)
router.post("/submit-test", verifyUser, MBTIController.submitTest);
router.get("/my-results", verifyUser, MBTIController.getUserResults);
router.get("/result/:resultId", verifyUser, MBTIController.getResultDetails);

// Admin routes (require admin authentication)
router.post("/questions", verifyAdmin, MBTIController.addQuestion);
router.put("/questions/:id", verifyAdmin, MBTIController.updateQuestion);
router.delete("/questions/:id", verifyAdmin, MBTIController.deleteQuestion);
router.get("/all-results", verifyAdmin, MBTIController.getAllResults);
router.get("/analytics", verifyAdmin, MBTIController.getAnalytics);

module.exports = router;
