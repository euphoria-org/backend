const MBTIModel = require("../models/MBTIModel");
const MBTIResult = require("../models/MBTIResult");

exports.addQuestion = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to add questions.",
      });
    }

    const {
      question,
      positiveLetter,
      negativeLetter,
      scoreDirection,
      dimensionName,
    } = req.body;
    if (
      !question ||
      !positiveLetter ||
      !negativeLetter ||
      !scoreDirection ||
      !dimensionName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required (question, positiveLetter, negativeLetter, scoreDirection, dimensionName)",
      });
    }
    const lastQuestion = await MBTIModel.findOne().sort({ order: -1 });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;
    const validLetters = ["E", "I", "S", "N", "T", "F", "J", "P"];
    if (
      !validLetters.includes(positiveLetter) ||
      !validLetters.includes(negativeLetter)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid letters. Use E/I, S/N, T/F, or J/P",
      });
    }
    if (scoreDirection !== "+" && scoreDirection !== "-") {
      return res.status(400).json({
        success: false,
        message: "Score direction must be '+' or '-'",
      });
    }
    const validDimensions = [
      "Extraversion-Introversion",
      "Sensing-Intuition",
      "Thinking-Feeling",
      "Judging-Perceiving",
    ];
    if (!validDimensions.includes(dimensionName)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid dimension name. Use: Extraversion-Introversion, Sensing-Intuition, Thinking-Feeling, or Judging-Perceiving",
      });
    }
    const newQuestion = new MBTIModel({
      question,
      positiveLetter,
      negativeLetter,
      scoreDirection,
      dimensionName,
      order: nextOrder,
    });
    const savedQuestion = await newQuestion.save();

    // Log admin action
    logAdminAction(req.admin._id, "CREATE", "MBTI Question", savedQuestion._id);

    res.status(201).json({
      success: true,
      message: "Question added successfully",
      data: savedQuestion,
    });
  } catch (err) {
    console.error("Error adding question:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required to delete questions.",
      });
    }

    const { id } = req.params;
    const deletedQuestion = await MBTIModel.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Log admin action
    logAdminAction(req.admin._id, "DELETE", "MBTI Question", id);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
      data: deletedQuestion,
    });
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await MBTIModel.find().sort({ order: 1 });
    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required to update questions.",
      });
    }

    const { id } = req.params;
    const {
      question,
      positiveLetter,
      negativeLetter,
      scoreDirection,
      dimensionName,
    } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required for update",
      });
    }
    const existingQuestion = await MBTIModel.findById(id);
    if (!existingQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }
    const updateData = {};
    if (question !== undefined) {
      if (!question.trim()) {
        return res.status(400).json({
          success: false,
          message: "Question cannot be empty",
        });
      }
      updateData.question = question;
    }
    if (positiveLetter !== undefined) {
      const validLetters = ["E", "I", "S", "N", "T", "F", "J", "P"];
      if (!validLetters.includes(positiveLetter)) {
        return res.status(400).json({
          success: false,
          message: "Invalid positive letter. Use E, I, S, N, T, F, J, or P",
        });
      }
      updateData.positiveLetter = positiveLetter;
    }
    if (negativeLetter !== undefined) {
      const validLetters = ["E", "I", "S", "N", "T", "F", "J", "P"];
      if (!validLetters.includes(negativeLetter)) {
        return res.status(400).json({
          success: false,
          message: "Invalid negative letter. Use E, I, S, N, T, F, J, or P",
        });
      }
      updateData.negativeLetter = negativeLetter;
    }
    if (positiveLetter !== undefined && negativeLetter !== undefined) {
      const validCombinations = [
        ["E", "I"],
        ["I", "E"],
        ["S", "N"],
        ["N", "S"],
        ["T", "F"],
        ["F", "T"],
        ["J", "P"],
        ["P", "J"],
      ];
      const isValidCombination = validCombinations.some(
        ([pos, neg]) => pos === positiveLetter && neg === negativeLetter
      );
      if (!isValidCombination) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid letter combination. Use E/I, S/N, T/F, or J/P pairs",
        });
      }
    }
    if (scoreDirection !== undefined) {
      if (scoreDirection !== "+" && scoreDirection !== "-") {
        return res.status(400).json({
          success: false,
          message: "Score direction must be '+' or '-'",
        });
      }
      updateData.scoreDirection = scoreDirection;
    }
    if (dimensionName !== undefined) {
      const validDimensions = [
        "Extraversion-Introversion",
        "Sensing-Intuition",
        "Thinking-Feeling",
        "Judging-Perceiving",
      ];
      if (!validDimensions.includes(dimensionName)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid dimension name. Use: Extraversion-Introversion, Sensing-Intuition, Thinking-Feeling, or Judging-Perceiving",
        });
      }
      updateData.dimensionName = dimensionName;
    }
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }
    const updatedQuestion = await MBTIModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    // Log admin action
    logAdminAction(req.admin._id, "UPDATE", "MBTI Question", id);

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
      updatedFields: Object.keys(updateData),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Additional methods for user MBTI test functionality

// Submit MBTI test responses and calculate result
exports.submitTest = async (req, res) => {
  try {
    const { responses } = req.body; // Array of {questionId, answer} where answer is 1-5 scale
    const userId = req.user._id;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "Responses must be provided as an array",
      });
    }

    // Get all questions to validate and calculate scores
    const questions = await MBTIModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    // Calculate MBTI scores
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    responses.forEach((response, index) => {
      const question = questions[index];
      const { answer } = response; // 1-5 scale (1=strongly disagree, 5=strongly agree)

      // Validate answer range
      if (answer < 1 || answer > 5) {
        throw new Error(
          `Answer for question ${index + 1} must be between 1 and 5`
        );
      }

      // Convert 1-5 scale to -2 to +2 scale
      let score = answer - 3;

      // Apply score direction
      if (question.scoreDirection === "-") {
        score = -score;
      }

      // Add to positive letter, subtract from negative letter
      scores[question.positiveLetter] += Math.max(0, score);
      scores[question.negativeLetter] += Math.max(0, -score);
    });

    // Determine MBTI type
    const mbtiType =
      (scores.E > scores.I ? "E" : "I") +
      (scores.S > scores.N ? "S" : "N") +
      (scores.T > scores.F ? "T" : "F") +
      (scores.J > scores.P ? "J" : "P");

    // Save result
    const mbtiResult = new MBTIResult({
      userId,
      mbtiType,
      scores,
      responses,
      completedAt: new Date(),
    });

    await mbtiResult.save();

    res.status(200).json({
      success: true,
      message: "MBTI test completed successfully",
      result: {
        mbtiType,
        scores,
        description: getMBTIDescription(mbtiType),
        id: mbtiResult._id,
      },
    });
  } catch (error) {
    console.error("Error submitting MBTI test:", error);
    res.status(500).json({
      success: false,
      message: "Error processing test submission",
      error: error.message,
    });
  }
};

// Submit MBTI test responses for guests (no authentication required)
// Creates a temporary result with session ID that can be claimed later
exports.submitTestGuest = async (req, res) => {
  try {
    const { responses, sessionId } = req.body; // Array of {questionId, answer} where answer is 1-5 scale

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "Responses must be provided as an array",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required for temporary storage",
      });
    }

    // Get all questions to validate and calculate scores
    const questions = await MBTIModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    // Calculate MBTI scores
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    responses.forEach((response, index) => {
      const question = questions[index];
      const { answer } = response; // 1-5 scale (1=strongly disagree, 5=strongly agree)

      // Validate answer range
      if (answer < 1 || answer > 5) {
        throw new Error(
          `Answer for question ${index + 1} must be between 1 and 5`
        );
      }

      // Convert 1-5 scale to -2 to +2 scale
      let score = answer - 3;

      // Apply score direction
      if (question.scoreDirection === "-") {
        score = -score;
      }

      // Add to positive letter, subtract from negative letter
      scores[question.positiveLetter] += Math.max(0, score);
      scores[question.negativeLetter] += Math.max(0, -score);
    });

    // Determine MBTI type
    const mbtiType =
      (scores.E > scores.I ? "E" : "I") +
      (scores.S > scores.N ? "S" : "N") +
      (scores.T > scores.F ? "T" : "F") +
      (scores.J > scores.P ? "J" : "P");

    // Save result with temporary status and session ID
    const mbtiResult = new MBTIResult({
      userId: null, // No user ID for temporary results
      sessionId,
      status: "temporary",
      mbtiType,
      scores,
      responses,
      completedAt: new Date(),
    });

    await mbtiResult.save();

    res.status(200).json({
      success: true,
      message:
        "MBTI test completed successfully. Please login to save and view your personalized results.",
      result: {
        mbtiType,
        scores,
        description: getMBTIDescription(mbtiType),
        id: mbtiResult._id,
        totalQuestions: questions.length,
        completedAt: mbtiResult.completedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting guest MBTI test:", error);
    res.status(500).json({
      success: false,
      message: "Error processing test submission",
      error: error.message,
    });
  }
};

exports.claimTemporaryResult = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "Session ID is required to claim results",
      });
    }

    const temporaryResult = await MBTIResult.findOne({
      sessionId,
      status: "temporary",
      userId: null,
    });

    if (!temporaryResult) {
      return res.status(404).json({
        success: false,
        message: "No temporary test result found with this session ID",
      });
    }

    temporaryResult.userId = userId;
    temporaryResult.status = "claimed";
    await temporaryResult.save();

    res.status(200).json({
      success: true,
      message: "Test result successfully linked to your account",
      result: {
        id: temporaryResult._id,
        mbtiType: temporaryResult.mbtiType,
        scores: temporaryResult.scores,
        description: getMBTIDescription(temporaryResult.mbtiType),
        completedAt: temporaryResult.completedAt,
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    console.error("Error claiming temporary result:", error);
    res.status(500).json({
      success: false,
      message: "Error claiming test result",
      error: error.message,
    });
  }
};

exports.getUserResults = async (req, res) => {
  try {
    const userId = req.user._id;

    const results = await MBTIResult.find({
      userId,
      status: "claimed",
    })
      .sort({ completedAt: -1 })
      .select("-responses");

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching user results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching results",
      error: error.message,
    });
  }
};

exports.getResultDetails = async (req, res) => {
  try {
    const { resultId } = req.params;
    const userId = req.user ? req.user._id : null;

    let result;

    if (userId) {
      result = await MBTIResult.findOne({
        _id: resultId,
        userId,
        status: "claimed",
      }).populate("userId", "name email");
    } else {
      result = await MBTIResult.findOne({
        _id: resultId,
        status: "temporary",
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found or access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...result.toObject(),
        description: getMBTIDescription(result.mbtiType),
      },
    });
  } catch (error) {
    console.error("Error fetching result details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching result details",
      error: error.message,
    });
  }
};

// Admin: Get all results for analysis
exports.getAllResults = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required to view all results.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const results = await MBTIResult.find()
      .populate("userId", "name email")
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MBTIResult.countDocuments();

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: results.length,
        totalResults: total,
      },
    });
  } catch (error) {
    console.error("Error fetching all results:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all results",
      error: error.message,
    });
  }
};

// Admin: Get analytics data
exports.getAnalytics = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to view analytics.",
      });
    }

    // Get total results count
    const totalResults = await MBTIResult.countDocuments();

    // Get MBTI type distribution
    const typeDistribution = await MBTIResult.aggregate([
      {
        $group: {
          _id: "$mbtiType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get results per month for the last 12 months
    const monthlyResults = await MBTIResult.aggregate([
      {
        $match: {
          completedAt: {
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last 12 months
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResults,
        typeDistribution,
        monthlyResults,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: error.message,
    });
  }
};

// Helper function to get MBTI type descriptions
function getMBTIDescription(type) {
  const descriptions = {
    INTJ: "The Architect - Strategic and analytical",
    INTP: "The Thinker - Innovative and curious",
    ENTJ: "The Commander - Bold and strong-willed",
    ENTP: "The Debater - Smart and curious",
    INFJ: "The Advocate - Creative and insightful",
    INFP: "The Mediator - Poetic and kind",
    ENFJ: "The Protagonist - Charismatic and inspiring",
    ENFP: "The Campaigner - Enthusiastic and creative",
    ISTJ: "The Logistician - Practical and fact-minded",
    ISFJ: "The Protector - Warm-hearted and dedicated",
    ESTJ: "The Executive - Organized and driven",
    ESFJ: "The Consul - Caring and social",
    ISTP: "The Virtuoso - Bold and practical",
    ISFP: "The Adventurer - Flexible and charming",
    ESTP: "The Entrepreneur - Smart and energetic",
    ESFP: "The Entertainer - Spontaneous and enthusiastic",
  };

  return descriptions[type] || "Unknown type";
}

// Helper function to log admin actions for security auditing
async function logAdminAction(
  adminId,
  action,
  resourceType,
  resourceId = null,
  details = null,
  ipAddress = null
) {
  try {
    const AdminLog = require("../models/AdminLog");

    const adminLog = new AdminLog({
      adminId,
      action,
      resourceType,
      resourceId,
      details,
      ipAddress,
    });
    await adminLog.save();

    const timestamp = new Date().toISOString();
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
}
