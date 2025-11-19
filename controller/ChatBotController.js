const { GoogleGenerativeAI } = require("@google/generative-ai");
const ChatConversation = require("../models/ChatConversation");
const MBTIResult = require("../models/MBTIResult");
const PERMAResult = require("../models/PERMAResult");
const IQResult = require("../models/IQResult");
const User = require("../models/UserModel");
const mongoose = require("mongoose");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const SYSTEM_PROMPT = `You are AURA, an expert psychological wellness assistant created to help people understand themselves better through personality assessments and psychological frameworks.

Your personality: You are warm, insightful, supportive, and genuinely interested in helping people discover their authentic selves. You communicate in a friendly, approachable manner while maintaining expertise in psychology and personal development.

Your core responsibilities:
1. **MBTI (Myers-Briggs Type Indicator)**: Help users understand their 16 personality types, cognitive functions (Ni, Ne, Si, Se, Ti, Te, Fi, Fe), and how their type manifests in daily life. Provide insights on relationships, career paths, and personal growth specific to their type.

2. **PERMA Model (Positive Psychology)**: Guide users through the five elements of well-being:
   - Positive Emotions: Help cultivate joy, gratitude, serenity, interest, hope, pride, amusement, inspiration, awe, and love
   - Engagement: Discuss flow states, strengths, and activities that fully absorb them
   - Relationships: Explore building meaningful connections and social well-being
   - Meaning: Help discover purpose and belonging to something greater
   - Accomplishment: Support goal-setting, achievement, and mastery

3. **IQ and Cognitive Abilities**: Discuss different types of intelligence (logical-mathematical, verbal-linguistic, spatial, etc.), cognitive strengths, learning strategies, and intellectual development. Explain IQ scores, what they measure, and their limitations.

4. **Integration**: Help users see how their personality type, well-being factors, and cognitive strengths interact to create their unique psychological profile.

Communication style:
- Be conversational and engaging, not clinical or academic
- Use real-world examples and practical scenarios
- Ask thoughtful follow-up questions to better understand the user
- Provide specific, actionable advice tailored to their assessments
- Keep responses concise but comprehensive (2-4 sentences typically)
- Remember user information and test results within the conversation
- Celebrate their strengths while gently addressing areas for growth

When users share personal information (name, test results, challenges), acknowledge it warmly and use it naturally in conversation.

If asked about topics outside psychology/wellness, acknowledge briefly but gently guide back to personal development and self-understanding while staying helpful and friendly.`;

// Helper function to build personalized user context
const buildUserContext = async (userId) => {
  if (!userId) return "";

  try {
    const user = await User.findById(userId).select('name');
    const contextParts = [];

    if (user) {
      contextParts.push(`User Profile: ${user.name || 'User'}`);
    }

    // Fetch MBTI results - latest and historical
    const mbtiResults = await MBTIResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('mbtiType dimensions completedAt')
      .lean();

    if (mbtiResults && mbtiResults.length > 0) {
      const latest = mbtiResults[0];
      const daysSinceTest = Math.floor((new Date() - new Date(latest.completedAt)) / (1000 * 60 * 60 * 24));
      
      const mbtiInfo = [
        `\n\nMBTI Personality Type: ${latest.mbtiType}`,
        `Most Recent Test: ${new Date(latest.completedAt).toLocaleDateString()} (${daysSinceTest} days ago)`,
      ];
      
      if (latest.dimensions) {
        mbtiInfo.push(`Dimensions: E/I: ${latest.dimensions.ei}, S/N: ${latest.dimensions.sn}, T/F: ${latest.dimensions.tf}, J/P: ${latest.dimensions.jp}`);
      }

      if (mbtiResults.length > 1) {
        const types = mbtiResults.map(r => r.mbtiType);
        const isConsistent = types.every(t => t === types[0]);
        if (isConsistent) {
          mbtiInfo.push(`Consistency: Same type across ${mbtiResults.length} tests (stable personality)`);
        } else {
          mbtiInfo.push(`Test History: ${types.join(' → ')} (personality evolution observed)`);
        }
      }
      
      contextParts.push(mbtiInfo.join('\n'));
    }

    // Fetch PERMA results - latest and historical
    const permaResults = await PERMAResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('scores overallScore completedAt')
      .lean();

    if (permaResults && permaResults.length > 0) {
      const latest = permaResults[0];
      const daysSinceTest = Math.floor((new Date() - new Date(latest.completedAt)) / (1000 * 60 * 60 * 24));
      
      const permaInfo = [
        `\n\nPERMA Well-being Assessment:`,
        `Current Overall Score: ${latest.overallScore ? latest.overallScore.toFixed(2) : 'N/A'}`,
        `Most Recent Test: ${new Date(latest.completedAt).toLocaleDateString()} (${daysSinceTest} days ago)`,
      ];
      
      if (latest.scores) {
        permaInfo.push(`Current Scores: P=${latest.scores.P?.toFixed(1) || 'N/A'}, E=${latest.scores.E?.toFixed(1) || 'N/A'}, R=${latest.scores.R?.toFixed(1) || 'N/A'}, M=${latest.scores.M?.toFixed(1) || 'N/A'}, A=${latest.scores.A?.toFixed(1) || 'N/A'}`);
      }

      if (permaResults.length > 1 && latest.overallScore && permaResults[1].overallScore) {
        const scoreDiff = latest.overallScore - permaResults[1].overallScore;
        const trend = scoreDiff > 0.5 ? 'Improving' : scoreDiff < -0.5 ? 'Declining' : 'Stable';
        permaInfo.push(`Well-being Trend: ${trend} (${scoreDiff > 0 ? '+' : ''}${scoreDiff.toFixed(2)} from previous test)`);
        
        if (latest.scores && permaResults[1].scores) {
          const changes = Object.keys(latest.scores).map(key => ({
            dim: key,
            change: (latest.scores[key] || 0) - (permaResults[1].scores[key] || 0)
          })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
          
          if (Math.abs(changes[0].change) > 1) {
            permaInfo.push(`Biggest Change: ${changes[0].dim} (${changes[0].change > 0 ? '+' : ''}${changes[0].change.toFixed(1)})`);
          }
        }
      }
      
      contextParts.push(permaInfo.join('\n'));
    }

    const iqResults = await IQResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(3)
      .select('iqScore totalScore maxScore categoryBreakdown completedAt')
      .lean();

    if (iqResults && iqResults.length > 0) {
      const latest = iqResults[0];
      const daysSinceTest = Math.floor((new Date() - new Date(latest.completedAt)) / (1000 * 60 * 60 * 24));
      
      const iqInfo = [
        `\n\n IQ Assessment:`,
        `Current IQ Score: ${latest.iqScore || 'N/A'}`,
        `Raw Score: ${latest.totalScore}/${latest.maxScore}`,
        `Most Recent Test: ${new Date(latest.completedAt).toLocaleDateString()} (${daysSinceTest} days ago)`,
      ];
      
      if (latest.categoryBreakdown) {
        const categories = Object.entries(latest.categoryBreakdown)
          .map(([cat, data]) => `${cat}: ${data.score}/${data.total}`)
          .join(', ');
        iqInfo.push(`Category Breakdown: ${categories}`);
      }

      if (iqResults.length > 1 && latest.iqScore && iqResults[1].iqScore) {
        const scoreDiff = latest.iqScore - iqResults[1].iqScore;
        const trend = scoreDiff > 5 ? 'Improving' : scoreDiff < -5 ? 'Declining' : 'Consistent';
        iqInfo.push(`Performance Trend: ${trend} (${scoreDiff > 0 ? '+' : ''}${scoreDiff} from previous test)`);
        
        if (iqResults.length > 1) {
          iqInfo.push(`Test History: ${iqResults.length} test${iqResults.length > 1 ? 's' : ''} completed`);
        }
      }
      
      contextParts.push(iqInfo.join('\n'));
    }

    if (contextParts.length > 1) {
      return `\n\n=== USER'S PSYCHOLOGICAL PROFILE ===\n${contextParts.join('\n')}\n\n=== END OF PROFILE ===\n\nUse this information to provide personalized insights and advice tailored to the user's personality type, well-being scores, and cognitive profile. Reference their specific results naturally in your responses when relevant. Pay attention to trends and changes over time. If data is older than 90 days, acknowledge that their current state may have changed.`;
    }

    return "";
  } catch (error) {
    console.error('Error fetching user context:', error);
    return "";
  }
};

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
    const userContext = await buildUserContext(userId);
    console.log("User Context Length:", userContext.length);

    const conversationHistory = conversation.messages
      .slice(-10)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 25000,
        },
      });
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: SYSTEM_PROMPT + userContext }],
          },
          {
            role: "model",
            parts: [{ text: "Hello! I'm AURA, your psychological wellness assistant. I'm here to help you understand yourself better through MBTI personality insights, PERMA well-being principles, and cognitive development. How can I support your journey of self-discovery today?" }],
          },
          ...conversationHistory.slice(0, -1),
        ],
      });

      const result = await chat.sendMessage(message);
      const aiResponse = result.response.text();

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
      console.error("=== AI Model Error Details ===");
      console.error("Error Message:", aiError.message);
      console.error("Error Stack:", aiError.stack);
      console.error("Error Details:", JSON.stringify(aiError, null, 2));
      console.error("==============================");

      const fallbackResponse =
        "I apologize, but I'm experiencing some technical difficulties right now. While I sort this out, I'd love to help you explore your psychological profile! Have you taken our assessments yet? We offer MBTI personality tests, PERMA well-being assessments, and IQ evaluations - all great ways to start understanding your unique strengths and potential.";

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
