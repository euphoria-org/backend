const IQModel = require("../models/IQModel");
const IQResult = require("../models/IQResult");
const User = require("../models/UserModel");

exports.addQuestion = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to add questions.",
      });
    }

    const { question, category, difficulty, options, correctAnswer, points, explanation } = req.body;
    
    if (!question || !category || !difficulty || !options || correctAnswer === undefined) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided (question, category, difficulty, options, correctAnswer)",
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Options must be an array with at least 2 choices",
      });
    }

    if (correctAnswer < 0 || correctAnswer >= options.length) {
      return res.status(400).json({
        success: false,
        message: `Correct answer index must be between 0 and ${options.length - 1}`,
      });
    }

    const lastQuestion = await IQModel.findOne().sort({ order: -1 });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

    const validCategories = [
      "Logical Reasoning",
      "Pattern Recognition",
      "Verbal Comprehension",
      "Numerical Ability",
      "Spatial Reasoning",
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Use: Logical Reasoning, Pattern Recognition, Verbal Comprehension, Numerical Ability, or Spatial Reasoning",
      });
    }

    const validDifficulties = ["Easy", "Medium", "Hard"];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty. Use: Easy, Medium, or Hard",
      });
    }

    const questionPoints = points || (difficulty === "Easy" ? 1 : difficulty === "Medium" ? 2 : 3);

    const newQuestion = new IQModel({
      question,
      category,
      difficulty,
      options,
      correctAnswer,
      points: questionPoints,
      order: nextOrder,
      explanation: explanation || "",
    });
    
    const savedQuestion = await newQuestion.save();

    logAdminAction(
      req.admin._id,
      "CREATE",
      "IQ Question",
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
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to delete questions.",
      });
    }

    const { id } = req.params;
    const deletedQuestion = await IQModel.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    logAdminAction(req.admin._id, "DELETE", "IQ Question", id);

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
    const isAdmin = req.admin ? true : false;
    
    const questions = await IQModel.find().sort({ order: 1 });
    
    if (!isAdmin) {
      const sanitizedQuestions = questions.map(q => ({
        _id: q._id,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        options: q.options,
        points: q.points,
        order: q.order,
      }));
      
      return res.status(200).json({
        success: true,
        data: sanitizedQuestions,
      });
    }
    
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
        message: "Access denied. Admin privileges required to update questions.",
      });
    }

    const { id } = req.params;
    const { question, category, difficulty, options, correctAnswer, points, explanation } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Question ID is required for update",
      });
    }

    const existingQuestion = await IQModel.findById(id);
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

    if (category !== undefined) {
      const validCategories = [
        "Logical Reasoning",
        "Pattern Recognition",
        "Verbal Comprehension",
        "Numerical Ability",
        "Spatial Reasoning",
      ];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }
      updateData.category = category;
    }

    if (difficulty !== undefined) {
      const validDifficulties = ["Easy", "Medium", "Hard"];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: "Invalid difficulty. Use: Easy, Medium, or Hard",
        });
      }
      updateData.difficulty = difficulty;
    }

    if (options !== undefined) {
      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Options must be an array with at least 2 choices",
        });
      }
      updateData.options = options;
    }

    if (correctAnswer !== undefined) {
      const optionCount = options ? options.length : existingQuestion.options.length;
      if (correctAnswer < 0 || correctAnswer >= optionCount) {
        return res.status(400).json({
          success: false,
          message: `Correct answer index must be between 0 and ${optionCount - 1}`,
        });
      }
      updateData.correctAnswer = correctAnswer;
    }

    if (points !== undefined) {
      updateData.points = points;
    }

    if (explanation !== undefined) {
      updateData.explanation = explanation;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedQuestion = await IQModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    logAdminAction(req.admin._id, "UPDATE", "IQ Question", id);

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
    const { responses, timeTaken } = req.body;
    const userId = req.user._id;

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        message: "Responses must be provided as an array",
      });
    }

    const questions = await IQModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    let totalCorrect = 0;
    let rawScore = 0;
    const categoryScores = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };
    const categoryCorrect = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };
    const categoryTotal = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };

    const detailedResponses = responses.map((response, index) => {
      const question = questions[index];
      const { selectedAnswer } = response;
      
      const isCorrect = selectedAnswer === question.correctAnswer;
      const pointsEarned = isCorrect ? question.points : 0;
      
      if (isCorrect) {
        totalCorrect++;
        categoryCorrect[question.category]++;
      }
      
      rawScore += pointsEarned;
      categoryTotal[question.category]++;
      
      return {
        questionId: question._id,
        questionIndex: index,
        selectedAnswer,
        isCorrect,
        points: pointsEarned,
      };
    });

    Object.keys(categoryScores).forEach((category) => {
      if (categoryTotal[category] > 0) {
        categoryScores[category] = Math.round(
          (categoryCorrect[category] / categoryTotal[category]) * 100
        );
      }
    });

    const percentCorrect = (totalCorrect / questions.length) * 100;
    const iqScore = calculateIQScore(percentCorrect, rawScore, questions.length);
    const iqLevel = getIQLevel(iqScore);
    const percentile = calculatePercentile(iqScore);

    const iqResult = new IQResult({
      userId,
      iqScore,
      iqLevel,
      categoryScores,
      totalCorrect,
      totalQuestions: questions.length,
      rawScore,
      percentile,
      responses: detailedResponses,
      timeTaken: timeTaken || 0,
      status: "claimed",
      completedAt: new Date(),
    });

    await iqResult.save();

    await User.findByIdAndUpdate(
      userId,
      { $push: { iqResults: iqResult._id } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "IQ test completed successfully",
      result: {
        iqScore,
        iqLevel,
        categoryScores,
        totalCorrect,
        totalQuestions: questions.length,
        percentile,
        description: getIQDescription(iqLevel),
        id: iqResult._id,
      },
    });
  } catch (error) {
    console.error("Error submitting IQ test:", error);
    res.status(500).json({
      success: false,
      message: "Error processing test submission",
      error: error.message,
    });
  }
};

exports.submitTestGuest = async (req, res) => {
  try {
    const { responses, sessionId, timeTaken } = req.body;

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

    const questions = await IQModel.find().sort({ order: 1 });

    if (responses.length !== questions.length) {
      return res.status(400).json({
        success: false,
        message: `All ${questions.length} questions must be answered`,
      });
    }

    let totalCorrect = 0;
    let rawScore = 0;
    const categoryScores = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };
    const categoryCorrect = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };
    const categoryTotal = {
      "Logical Reasoning": 0,
      "Pattern Recognition": 0,
      "Verbal Comprehension": 0,
      "Numerical Ability": 0,
      "Spatial Reasoning": 0,
    };

    const detailedResponses = responses.map((response, index) => {
      const question = questions[index];
      const { selectedAnswer } = response;
      
      const isCorrect = selectedAnswer === question.correctAnswer;
      const pointsEarned = isCorrect ? question.points : 0;
      
      if (isCorrect) {
        totalCorrect++;
        categoryCorrect[question.category]++;
      }
      
      rawScore += pointsEarned;
      categoryTotal[question.category]++;
      
      return {
        questionId: question._id,
        questionIndex: index,
        selectedAnswer,
        isCorrect,
        points: pointsEarned,
      };
    });

    Object.keys(categoryScores).forEach((category) => {
      if (categoryTotal[category] > 0) {
        categoryScores[category] = Math.round(
          (categoryCorrect[category] / categoryTotal[category]) * 100
        );
      }
    });

    const percentCorrect = (totalCorrect / questions.length) * 100;
    const iqScore = calculateIQScore(percentCorrect, rawScore, questions.length);
    const iqLevel = getIQLevel(iqScore);
    const percentile = calculatePercentile(iqScore);

    const iqResult = new IQResult({
      userId: null,
      sessionId,
      status: "temporary",
      iqScore,
      iqLevel,
      categoryScores,
      totalCorrect,
      totalQuestions: questions.length,
      rawScore,
      percentile,
      responses: detailedResponses,
      timeTaken: timeTaken || 0,
      completedAt: new Date(),
    });

    await iqResult.save();

    res.status(200).json({
      success: true,
      message: "IQ test completed successfully. Please login to save and view your personalized results.",
      result: {
        iqScore,
        iqLevel,
        categoryScores,
        totalCorrect,
        totalQuestions: questions.length,
        percentile,
        description: getIQDescription(iqLevel),
        id: iqResult._id,
        completedAt: iqResult.completedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting guest IQ test:", error);
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

    const temporaryResult = await IQResult.findOne({
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
        iqScore: temporaryResult.iqScore,
        iqLevel: temporaryResult.iqLevel,
        categoryScores: temporaryResult.categoryScores,
        totalCorrect: temporaryResult.totalCorrect,
        totalQuestions: temporaryResult.totalQuestions,
        percentile: temporaryResult.percentile,
        description: getIQDescription(temporaryResult.iqLevel),
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

    const results = await IQResult.find({
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
      result = await IQResult.findOne({
        _id: resultId,
        userId,
        status: "claimed",
      }).populate("userId", "name email");
    } else {
      result = await IQResult.findOne({
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
        description: getIQDescription(result.iqLevel),
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

exports.getAllResults = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to view all results.",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const results = await IQResult.find()
      .populate("userId", "name email")
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await IQResult.countDocuments();

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

exports.getAnalytics = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required to view analytics.",
      });
    }

    const totalResults = await IQResult.countDocuments();
    const totalQuestions = await IQModel.countDocuments();

    const iqLevelDistribution = await IQResult.aggregate([
      {
        $group: {
          _id: "$iqLevel",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    const avgIQData = await IQResult.aggregate([
      {
        $group: {
          _id: null,
          avgIQ: { $avg: "$iqScore" },
          avgPercentile: { $avg: "$percentile" },
          avgCorrect: { $avg: "$totalCorrect" },
        },
      },
    ]);

    const categoryAverages = await IQResult.aggregate([
      {
        $group: {
          _id: null,
          avgLogical: { $avg: "$categoryScores.Logical Reasoning" },
          avgPattern: { $avg: "$categoryScores.Pattern Recognition" },
          avgVerbal: { $avg: "$categoryScores.Verbal Comprehension" },
          avgNumerical: { $avg: "$categoryScores.Numerical Ability" },
          avgSpatial: { $avg: "$categoryScores.Spatial Reasoning" },
        },
      },
    ]);

    // Get results per month for the last 12 months
    const monthlyResults = await IQResult.aggregate([
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
          avgScore: { $avg: "$iqScore" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get question distribution by category
    const questionsByCategory = await IQModel.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get question distribution by difficulty
    const questionsByDifficulty = await IQModel.aggregate([
      {
        $group: {
          _id: "$difficulty",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalResults,
        totalQuestions,
        iqLevelDistribution,
        averages: avgIQData[0] || null,
        categoryAverages: categoryAverages[0] || null,
        monthlyResults,
        questionsByCategory,
        questionsByDifficulty,
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

// Helper function to calculate IQ score from performance
function calculateIQScore(percentCorrect, rawScore, totalQuestions) {
  
  const zScore = (percentCorrect - 50) / 20; // Simplified normalization

  let iqScore = Math.round(100 + (zScore * 15));

  iqScore = Math.max(40, Math.min(160, iqScore));
  
  return iqScore;
}

function getIQLevel(iqScore) {
  if (iqScore >= 145) return "Genius";
  if (iqScore >= 130) return "Very Superior";
  if (iqScore >= 115) return "Superior";
  if (iqScore >= 85) return "Average";
  if (iqScore >= 70) return "Below Average";
  return "Below Average";
}

function calculatePercentile(iqScore) {

  if (iqScore >= 145) return 99.9;
  if (iqScore >= 130) return 98;
  if (iqScore >= 120) return 91;
  if (iqScore >= 110) return 75;
  if (iqScore >= 100) return 50;
  if (iqScore >= 90) return 25;
  if (iqScore >= 80) return 9;
  return 2;
}

function getIQDescription(level) {
  const descriptions = {
    "Genius": "Exceptional intelligence! You're in the top 0.1% of the population.",
    "Very Superior": "Very high intelligence. You demonstrate outstanding cognitive abilities.",
    "Superior": "Above average intelligence. You have strong problem-solving and analytical skills.",
    "Average": "Average intelligence. You have solid cognitive abilities typical of most people.",
    "Below Average": "Your score suggests room for improvement in various cognitive areas.",
  };

  return descriptions[level] || "IQ assessment complete.";
}

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
