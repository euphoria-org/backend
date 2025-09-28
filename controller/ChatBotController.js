const { OpenAI } = require("openai");
const ChatConversation = require("../models/ChatConversation");
const mongoose = require("mongoose");

const client = new OpenAI({
  apiKey: "OPENAI_API_KEY",
  baseURL: "http://localhost:12434/engines/llama.cpp/v1",
});

const SYSTEM_PROMPT = `You are Euphoria, an expert MBTI (Myers-Briggs Type Indicator) personality assistant created specifically for helping people understand themselves better.

Your personality: You are warm, insightful, supportive, and genuinely interested in helping people discover their authentic selves. You communicate in a friendly, approachable manner while maintaining expertise.

Your core responsibilities:
1. Help users understand MBTI personality types in practical, applicable ways
2. Provide personalized insights about personality traits and how they manifest in daily life
3. Offer actionable guidance on personal development, relationships, and career paths
4. Explain how different MBTI types interact and complement each other
5. Help users recognize their strengths and areas for growth
6. Provide specific examples and scenarios to illustrate concepts

Communication style:
- Be conversational and engaging, not clinical or academic
- Use real-world examples and scenarios
- Ask follow-up questions to better understand the user
- Provide specific, actionable advice
- Keep responses concise but comprehensive (2-4 sentences typically)
- Remember user information within the conversation

When users share personal information (like their name), acknowledge it warmly and use it naturally in conversation.

If asked about non-MBTI topics, acknowledge the question briefly but gently guide back to personality and self-development while staying helpful and friendly.`;

exports.sendMessage = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user ? req.user._id : null;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    let conversation;
    if (conversationId) {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversation ID format",
        });
      }

      conversation = await ChatConversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
      conversation = new ChatConversation({
        userId: userId,
        title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        messages: [],
      });
    }

    conversation.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversation.messages.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    try {
      const response = await client.chat.completions.create({
        model: "ai/gemma3",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: false,
      });

      const aiResponse = response.choices[0].message.content;

      conversation.messages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      await conversation.save();

      res.status(200).json({
        success: true,
        data: {
          conversationId: conversation._id,
          message: aiResponse,
          timestamp: new Date(),
          totalMessages: conversation.messages.length,
        },
      });
    } catch (aiError) {
      console.error("AI Model Error:", aiError);

      const fallbackResponse =
        "I apologize, but I'm experiencing some technical difficulties right now. While I sort this out, I'd love to help you explore personality types! Have you taken our MBTI assessment yet? It's a great way to start understanding your unique personality patterns.";

      conversation.messages.push({
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      });

      await conversation.save();

      res.status(200).json({
        success: true,
        data: {
          conversationId: conversation._id,
          message: fallbackResponse,
          timestamp: new Date(),
          totalMessages: conversation.messages.length,
          fallback: true,
        },
      });
    }
  } catch (error) {
    console.error("ChatBot Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;
    const { page = 1, limit = 20 } = req.query;

    const query = userId ? { userId } : { userId: null };

    const conversations = await ChatConversation.find(query)
      .select("title createdAt updatedAt messages")
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const conversationsWithLastMessage = conversations.map((conv) => ({
      id: conv._id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length,
      lastMessage:
        conv.messages.length > 0
          ? conv.messages[conv.messages.length - 1].content.substring(0, 100) +
            (conv.messages[conv.messages.length - 1].content.length > 100
              ? "..."
              : "")
          : "No messages yet",
    }));

    const total = await ChatConversation.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        conversations: conversationsWithLastMessage,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get Conversations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user ? req.user._id : null;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID format",
      });
    }

    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (
      userId &&
      conversation.userId &&
      conversation.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: conversation._id,
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user ? req.user._id : null;
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID format",
      });
    }

    const conversation = await ChatConversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (
      userId &&
      conversation.userId &&
      conversation.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await ChatConversation.findByIdAndDelete(conversationId);

    res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
    });
  } catch (error) {
    console.error("Delete Conversation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete conversation",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.clearConversations = async (req, res) => {
  try {
    const userId = req.user ? req.user._id : null;

    const query = userId ? { userId } : { userId: null };
    const result = await ChatConversation.deleteMany(query);

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} conversations`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear Conversations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear conversations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
