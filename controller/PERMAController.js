const PERMAModel = require("../models/PERMAModel");
const PERMAResult = require("../models/PERMAResult");
const User = require("../models/UserModel");

exports.addQuestion = async (req, res) => {
  try {
    // Verify admin access
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to add questions.",
      });
    }

    const { question, dimension, dimensionName, scoreDirection } = req.body;
    if (!question || !dimension || !dimensionName || !scoreDirection) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required (question, dimension, dimensionName, scoreDirection)",
      });
    }

    const lastQuestion = await PERMAModel.findOne().sort({ order: -1 });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    const validDimensions = ["P", "E", "R", "M", "A"];
    if (!validDimensions.includes(dimension)) {
      return res.status(400).json({
        success: false,
        message: "Invalid dimension. Use P, E, R, M, or A",
      });
    }

    if (scoreDirection !== "+" && scoreDirection !== "-") {
      return res.status(400).json({
        success: false,
        message: "Score direction must be '+' or '-'",
      });
    }

    const validDimensionNames = [
      "Positive Emotion",
      "Engagement",
      "Relationships",
      "Meaning",
      "Accomplishment",
    ];
    if (!validDimensionNames.includes(dimensionName)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid dimension name. Use: Positive Emotion, Engagement, Relationships, Meaning, or Accomplishment",
      });
    }

    const newQuestion = new PERMAModel({
      question,
      dimension,
      dimensionName,
      scoreDirection,
      order: nextOrder,
    });
    const savedQuestion = await newQuestion.save();

    // Log admin action
    logAdminAction(
      req.admin._id,
      "CREATE",
      "PERMA Question",
      savedQuestion._id
    );

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
    const deletedQuestion = await PERMAModel.findByIdAndDelete(id);
    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // Log admin action
    logAdminAction(req.admin._id, "DELETE", "PERMA Question", id);

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
    const questions = await PERMAModel.find().sort({ order: 1 });
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
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Admin privileges required to update questions.",
      });
    }

    const { id } = req.params;
    const { question, dimension, dimensionName, scoreDirection } = req.body;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required for update",
      });
    }

    const existingQuestion = await PERMAModel.findById(id);
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

    if (dimension !== undefined) {
      const validDimensions = ["P", "E", "R", "M", "A"];
      if (!validDimensions.includes(dimension)) {
        return res.status(400).json({
          success: false,
          message: "Invalid dimension. Use P, E, R, M, or A",
        });
      }
      updateData.dimension = dimension;
    }

    if (dimensionName !== undefined) {
      const validDimensionNames = [
        "Positive Emotion",
        "Engagement",
        "Relationships",
        "Meaning",
        "Accomplishment",
      ];
      if (!validDimensionNames.includes(dimensionName)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid dimension name. Use: Positive Emotion, Engagement, Relationships, Meaning, or Accomplishment",
        });
      }
      updateData.dimensionName = dimensionName;
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

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedQuestion = await PERMAModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    logAdminAction(req.admin._id, "UPDATE", "PERMA Question", id);

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

exports.submitTest = async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user._id;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "Responses must be provided as an array",
      });
    }

    const questions = await PERMAModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    const scores = { P: 0, E: 0, R: 0, M: 0, A: 0 };
    const dimensionCounts = { P: 0, E: 0, R: 0, M: 0, A: 0 };

    responses.forEach((response, index) => {
      const question = questions[index];
      const { answer } = response;

      if (answer < 0 || answer > 10) {
        throw new Error(
          `Answer for question ${index + 1} must be between 0 and 10`
        );
      }

      let score = answer;

      // Apply reverse scoring if needed
      if (question.scoreDirection === "-") {
        score = 10 - answer;
      }

      scores[question.dimension] += score;
      dimensionCounts[question.dimension]++;
    });

    // Calculate average scores for each dimension
    Object.keys(scores).forEach((dimension) => {
      if (dimensionCounts[dimension] > 0) {
        scores[dimension] = scores[dimension] / dimensionCounts[dimension];
      }
    });

    // Calculate total and average
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const averageScore = totalScore / 5;

    // Determine wellbeing level
    let wellbeingLevel = "Moderate";
    if (averageScore >= 8) {
      wellbeingLevel = "Very High";
    } else if (averageScore >= 6) {
      wellbeingLevel = "High";
    } else if (averageScore >= 4) {
      wellbeingLevel = "Moderate";
    } else {
      wellbeingLevel = "Low";
    }

    const permaResult = new PERMAResult({
      userId,
      scores,
      totalScore,
      averageScore,
      wellbeingLevel,
      responses,
      status: "claimed",
      completedAt: new Date(),
    });

    await permaResult.save();

    await User.findByIdAndUpdate(
      userId,
      { $push: { permaResults: permaResult._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "PERMA test completed successfully",
      result: {
        scores,
        totalScore,
        averageScore,
        wellbeingLevel,
        description: getPERMADescription(wellbeingLevel),
        id: permaResult._id,
      },
    });
  } catch (error) {
    console.error("Error submitting PERMA test:", error);
    res.status(500).json({
      success: false,
      message: "Error processing test submission",
      error: error.message,
    });
  }
};

// Submit PERMA test responses for guests (no authentication required)
exports.submitTestGuest = async (req, res) => {
  try {
    const { responses, sessionId } = req.body;

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

    const questions = await PERMAModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    const scores = { P: 0, E: 0, R: 0, M: 0, A: 0 };
    const dimensionCounts = { P: 0, E: 0, R: 0, M: 0, A: 0 };

    responses.forEach((response, index) => {
      const question = questions[index];
      const { answer } = response;

      if (answer < 0 || answer > 10) {
        throw new Error(
          `Answer for question ${index + 1} must be between 0 and 10`
        );
      }

      let score = answer;

      if (question.scoreDirection === "-") {
        score = 10 - answer;
      }

      scores[question.dimension] += score;
      dimensionCounts[question.dimension]++;
    });

    // Calculate average scores for each dimension
    Object.keys(scores).forEach((dimension) => {
      if (dimensionCounts[dimension] > 0) {
        scores[dimension] = scores[dimension] / dimensionCounts[dimension];
      }
    });

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const averageScore = totalScore / 5;

    let wellbeingLevel = "Moderate";
    if (averageScore >= 8) {
      wellbeingLevel = "Very High";
    } else if (averageScore >= 6) {
      wellbeingLevel = "High";
    } else if (averageScore >= 4) {
      wellbeingLevel = "Moderate";
    } else {
      wellbeingLevel = "Low";
    }

    const permaResult = new PERMAResult({
      userId: null,
      sessionId,
      status: "temporary",
      scores,
      totalScore,
      averageScore,
      wellbeingLevel,
      responses,
      completedAt: new Date(),
    });

    await permaResult.save();

    res.status(200).json({
      success: true,
      message:
        "PERMA test completed successfully. Please login to save and view your personalized results.",
      result: {
        scores,
        totalScore,
        averageScore,
        wellbeingLevel,
        description: getPERMADescription(wellbeingLevel),
        id: permaResult._id,
        totalQuestions: questions.length,
        completedAt: permaResult.completedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting guest PERMA test:", error);
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

    const temporaryResult = await PERMAResult.findOne({
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
        scores: temporaryResult.scores,
        totalScore: temporaryResult.totalScore,
        averageScore: temporaryResult.averageScore,
        wellbeingLevel: temporaryResult.wellbeingLevel,
        description: getPERMADescription(temporaryResult.wellbeingLevel),
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

    const results = await PERMAResult.find({
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
      result = await PERMAResult.findOne({
        _id: resultId,
        userId,
        status: "claimed",
      }).populate("userId", "name email");
    } else {
      result = await PERMAResult.findOne({
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
        description: getPERMADescription(result.wellbeingLevel),
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

    const results = await PERMAResult.find()
      .populate("userId", "name email")
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PERMAResult.countDocuments();

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
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to view analytics.",
      });
    }

    const totalResults = await PERMAResult.countDocuments();

    // Get wellbeing level distribution
    const wellbeingDistribution = await PERMAResult.aggregate([
      {
        $group: {
          _id: "$wellbeingLevel",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get average scores by dimension
    const dimensionAverages = await PERMAResult.aggregate([
      {
        $group: {
          _id: null,
          avgP: { $avg: "$scores.P" },
          avgE: { $avg: "$scores.E" },
          avgR: { $avg: "$scores.R" },
          avgM: { $avg: "$scores.M" },
          avgA: { $avg: "$scores.A" },
        },
      },
    ]);

    // Get results per month for the last 12 months
    const monthlyResults = await PERMAResult.aggregate([
      {
        $match: {
          completedAt: {
            $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
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
        wellbeingDistribution,
        dimensionAverages: dimensionAverages[0] || null,
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

// Helper function to get PERMA wellbeing descriptions
function getPERMADescription(level) {
  const descriptions = {
    "Very High":
      "Exceptional wellbeing! You're flourishing across all dimensions of wellbeing.",
    High: "Strong wellbeing. You have a solid foundation of positive psychology.",
    Moderate:
      "Moderate wellbeing. There's room for growth in several areas of your life.",
    Low: "Consider focusing on improving your wellbeing across the PERMA dimensions.",
  };

  return descriptions[level] || "Wellbeing assessment complete.";
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
