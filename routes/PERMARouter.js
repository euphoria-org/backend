const express = require("express");
const router = express.Router();
const PERMAController = require("../controller/PERMAController");
const { verifyAdmin, verifyUser } = require("../middleware/Auth");

router.get("/questions", PERMAController.getAllQuestions);
router.post("/submit-test-guest", PERMAController.submitTestGuest);

router.post("/submit-test", verifyUser, PERMAController.submitTest);
router.get("/result/:resultId", verifyUser, PERMAController.getResultDetails);
router.post("/claim-result", verifyUser, PERMAController.claimTemporaryResult);
router.get("/my-results", verifyUser, PERMAController.getUserResults);

router.post("/questions", verifyAdmin, PERMAController.addQuestion);
router.put("/questions/:id", verifyAdmin, PERMAController.updateQuestion);
router.delete("/questions/:id", verifyAdmin, PERMAController.deleteQuestion);
router.get("/all-results", verifyAdmin, PERMAController.getAllResults);
router.get("/analytics", verifyAdmin, PERMAController.getAnalytics);

module.exports = router;
