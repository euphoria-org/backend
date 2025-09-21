const express = require("express");
const router = express.Router();
const MBTIController = require("../controller/MBTIController");
const { verifyAdmin, verifyUser } = require("../middleware/Auth");

router.get("/questions", MBTIController.getAllQuestions);
router.post("/submit-test-guest", MBTIController.submitTestGuest);

router.post("/submit-test", verifyUser, MBTIController.submitTest);
router.get("/result/:resultId", verifyUser, MBTIController.getResultDetails);
router.post("/claim-result", verifyUser, MBTIController.claimTemporaryResult);
router.get("/my-results", verifyUser, MBTIController.getUserResults);

router.post("/questions", verifyAdmin, MBTIController.addQuestion);
router.put("/questions/:id", verifyAdmin, MBTIController.updateQuestion);
router.delete("/questions/:id", verifyAdmin, MBTIController.deleteQuestion);
router.get("/all-results", verifyAdmin, MBTIController.getAllResults);
router.get("/analytics", verifyAdmin, MBTIController.getAnalytics);

module.exports = router;
