const express = require("express");
const router = express.Router();
const ChatBotController = require("../controller/ChatBotController");
const { verifyUser } = require("../middleware/Auth");

// Middleware to handle both authenticated and guest users
const chatAuth = (req, res, next) => {
  // Try to authenticate if token is provided
  if (req.headers.authorization) {
    return verifyUser(req, res, next);
  }
  // If no token, proceed as guest
  req.user = null;
  next();
};

// Chat endpoints
router.post("/message", chatAuth, ChatBotController.sendMessage);

// Conversation management (works for both authenticated and guest users)
router.get("/conversations", chatAuth, ChatBotController.getConversations);
router.get(
  "/conversations/:conversationId",
  chatAuth,
  ChatBotController.getConversation
);
router.delete(
  "/conversations/:conversationId",
  chatAuth,
  ChatBotController.deleteConversation
);

// Authenticated user only endpoints
router.delete(
  "/conversations",
  verifyUser,
  ChatBotController.clearConversations
);

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ChatBot service is running",
    timestamp: new Date().toISOString(),
    service: "MBTI ChatBot API",
  });
});

// Get chat statistics (for admin or user dashboard)
router.get("/stats", verifyUser, async (req, res) => {
  try {
    const ChatConversation = require("../models/ChatConversation");
    const userId = req.user._id;

    const stats = await ChatConversation.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalConversations: { $sum: 1 },
          totalMessages: { $sum: "$metadata.totalMessages" },
          avgMessagesPerConversation: { $avg: "$metadata.totalMessages" },
        },
      },
    ]);

    const result = stats[0] || {
      totalConversations: 0,
      totalMessages: 0,
      avgMessagesPerConversation: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        ...result,
        userId: userId,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Chat Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat statistics",
    });
  }
});

module.exports = router;
