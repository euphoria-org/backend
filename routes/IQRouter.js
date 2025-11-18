const express = require("express");
const router = express.Router();
const IQController = require("../controller/IQController");
const { verifyAdmin, verifyUser } = require("../middleware/Auth");

// Public routes
router.get("/questions", IQController.getAllQuestions);
router.post("/submit-test-guest", IQController.submitTestGuest);

// User authenticated routes
router.post("/submit-test", verifyUser, IQController.submitTest);
router.get("/result/:resultId", verifyUser, IQController.getResultDetails);
router.post("/claim-result", verifyUser, IQController.claimTemporaryResult);
router.get("/my-results", verifyUser, IQController.getUserResults);

// Admin routes
router.post("/questions", verifyAdmin, IQController.addQuestion);
router.put("/questions/:id", verifyAdmin, IQController.updateQuestion);
router.delete("/questions/:id", verifyAdmin, IQController.deleteQuestion);
router.get("/all-results", verifyAdmin, IQController.getAllResults);
router.get("/analytics", verifyAdmin, IQController.getAnalytics);

module.exports = router;
