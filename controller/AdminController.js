const AdminModel = require("../models/AdminModel");
const AdminLog = require("../models/AdminLog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

const logAdminAction = async (
  adminId,
  action,
  resourceType,
  resourceId = null,
  details = null,
  ipAddress = null
) => {
  try {
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
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    await AdminModel.findByIdAndUpdate(admin._id, {
      lastLogin: new Date(),
    });

    await logAdminAction(
      admin._id,
      "LOGIN",
      "Admin Session",
      null,
      `Login successful`,
      req.ip || "Unknown"
    );

    const token = generateToken(admin._id);

    const adminResponse = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      lastLogin: new Date(),
      createdAt: admin.createdAt,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.signupAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required",
      });
    }

    const existingAdmin = await AdminModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email or username already exists",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newAdmin = new AdminModel({
      username,
      email,
      password: hashedPassword,
    });

    const savedAdmin = await newAdmin.save();

    await logAdminAction(
      savedAdmin._id,
      "SIGNUP",
      "Admin Account",
      savedAdmin._id,
      `New admin account created: ${username}`,
      req.ip || "Unknown"
    );

    const token = generateToken(savedAdmin._id);

    const adminResponse = {
      id: savedAdmin._id,
      username: savedAdmin.username,
      email: savedAdmin.email,
      createdAt: savedAdmin.createdAt,
    };

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error during admin signup:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.admin._id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAdminLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get logs for current admin
    const logs = await AdminLog.find({ adminId: req.admin._id })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await AdminLog.countDocuments({ adminId: req.admin._id });

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: logs.length,
        totalLogs: total,
      },
    });
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const MBTIModel = require("../models/MBTIModel");
    const MBTIResult = require("../models/MBTIResult");
    const PERMAModel = require("../models/PERMAModel");
    const PERMAResult = require("../models/PERMAResult");
    const IQModel = require("../models/IQModel");
    const IQResult = require("../models/IQResult");

    // Get individual question counts
    const mbtiQuestionsCount = await MBTIModel.countDocuments();
    const permaQuestionsCount = await PERMAModel.countDocuments();
    const iqQuestionsCount = await IQModel.countDocuments();

    // Get total questions across all tests
    const totalQuestions = mbtiQuestionsCount + permaQuestionsCount + iqQuestionsCount;

    // Get individual test completions
    const mbtiTestsCount = await MBTIResult.countDocuments();
    const permaTestsCount = await PERMAResult.countDocuments();
    const iqTestsCount = await IQResult.countDocuments();

    // Get total test completions across all tests
    const totalTests = mbtiTestsCount + permaTestsCount + iqTestsCount;

    // Get tests completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mbtiTestsToday = await MBTIResult.countDocuments({
      completedAt: { $gte: today },
    });
    const permaTestsToday = await PERMAResult.countDocuments({
      completedAt: { $gte: today },
    });
    const iqTestsToday = await IQResult.countDocuments({
      completedAt: { $gte: today },
    });
    const testsToday = mbtiTestsToday + permaTestsToday + iqTestsToday;

    // Get tests completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const mbtiTestsThisWeek = await MBTIResult.countDocuments({
      completedAt: { $gte: weekAgo },
    });
    const permaTestsThisWeek = await PERMAResult.countDocuments({
      completedAt: { $gte: weekAgo },
    });
    const iqTestsThisWeek = await IQResult.countDocuments({
      completedAt: { $gte: weekAgo },
    });
    const testsThisWeek = mbtiTestsThisWeek + permaTestsThisWeek + iqTestsThisWeek;

    // Get most common MBTI type
    const mbtiTypeDistribution = await MBTIResult.aggregate([
      {
        $group: {
          _id: "$mbtiType",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const mostCommonMBTIType =
      mbtiTypeDistribution.length > 0 ? mbtiTypeDistribution[0] : null;

    // Get most popular PERMA dimension (highest average score across all tests)
    const permaPopularDimension = await PERMAResult.aggregate([
      {
        $project: {
          dimensions: { $objectToArray: "$scores" },
        },
      },
      { $unwind: "$dimensions" },
      {
        $group: {
          _id: "$dimensions.k",
          avgScore: { $avg: "$dimensions.v" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { avgScore: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const mostPopularPERMADimension =
      permaPopularDimension.length > 0
        ? {
            dimension: permaPopularDimension[0]._id,
            avgScore: permaPopularDimension[0].avgScore,
            count: permaPopularDimension[0].count,
          }
        : null;

    res.status(200).json({
      success: true,
      data: {
        totalQuestions,
        totalTests,
        testsToday,
        testsThisWeek,
        mostCommonType: mostCommonMBTIType,
        mostPopularPERMADimension,
        // Individual counts for each test type
        questionBreakdown: {
          mbti: mbtiQuestionsCount,
          perma: permaQuestionsCount,
          iq: iqQuestionsCount,
        },
        testBreakdown: {
          mbti: mbtiTestsCount,
          perma: permaTestsCount,
          iq: iqTestsCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all activity logs (admin actions + user activities)
exports.getAllActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || "all"; // all, admin, user, login, test

    const UserModel = require("../models/UserModel");
    const MBTIResult = require("../models/MBTIResult");
    const PERMAResult = require("../models/PERMAResult");
    const IQResult = require("../models/IQResult");

    let activityLogs = [];

    // Fetch admin logs
    if (filter === "all" || filter === "admin" || filter === "login") {
      const adminLogs = await AdminLog.find()
        .populate("adminId", "username email")
        .sort({ timestamp: -1 })
        .lean();

      adminLogs.forEach((log) => {
        activityLogs.push({
          id: log._id,
          type: "admin",
          action: log.action,
          user: log.adminId ? log.adminId.username : "Unknown Admin",
          email: log.adminId ? log.adminId.email : "N/A",
          details: log.details || log.resourceType,
          resourceType: log.resourceType,
          timestamp: log.timestamp || log.createdAt,
          ipAddress: log.ipAddress || "N/A",
        });
      });
    }

    // Fetch user login activities
    if (filter === "all" || filter === "user" || filter === "login") {
      const users = await UserModel.find()
        .select("name email createdAt updatedAt")
        .sort({ createdAt: -1 })
        .lean();

      users.forEach((user) => {
        activityLogs.push({
          id: user._id,
          type: "user_registration",
          action: "REGISTER",
          user: user.name,
          email: user.email,
          details: "User registered",
          resourceType: "User Account",
          timestamp: user.createdAt,
          ipAddress: "N/A",
        });
      });
    }

    // Fetch MBTI test results
    if (filter === "all" || filter === "test") {
      const mbtiResults = await MBTIResult.find()
        .populate("userId", "name email")
        .sort({ completedAt: -1 })
        .lean();

      mbtiResults.forEach((result) => {
        activityLogs.push({
          id: result._id,
          type: "mbti_test",
          action: "TEST_COMPLETED",
          user: result.userId ? result.userId.name : "Unknown User",
          email: result.userId ? result.userId.email : "N/A",
          details: `Completed MBTI Test - Result: ${result.mbtiType || "N/A"}`,
          resourceType: "MBTI Test",
          timestamp: result.completedAt || result.createdAt,
          ipAddress: "N/A",
          testResult: result.mbtiType,
        });
      });
    }

    // Fetch PERMA test results
    if (filter === "all" || filter === "test") {
      const permaResults = await PERMAResult.find()
        .populate("userId", "name email")
        .sort({ completedAt: -1 })
        .lean();

      permaResults.forEach((result) => {
        const avgScore =
          result.scores &&
          Object.values(result.scores).reduce((a, b) => a + b, 0) / 5;
        activityLogs.push({
          id: result._id,
          type: "perma_test",
          action: "TEST_COMPLETED",
          user: result.userId ? result.userId.name : "Unknown User",
          email: result.userId ? result.userId.email : "N/A",
          details: `Completed PERMA Test - Avg Score: ${
            avgScore ? avgScore.toFixed(2) : "N/A"
          }`,
          resourceType: "PERMA Test",
          timestamp: result.completedAt || result.createdAt,
          ipAddress: "N/A",
          testResult: avgScore ? avgScore.toFixed(2) : "N/A",
        });
      });
    }

    // Fetch IQ test results
    if (filter === "all" || filter === "test") {
      const iqResults = await IQResult.find()
        .populate("userId", "name email")
        .sort({ completedAt: -1 })
        .lean();

      iqResults.forEach((result) => {
        activityLogs.push({
          id: result._id,
          type: "iq_test",
          action: "TEST_COMPLETED",
          user: result.userId ? result.userId.name : "Unknown User",
          email: result.userId ? result.userId.email : "N/A",
          details: `Completed IQ Test - Score: ${result.totalScore || "N/A"}/${result.maxScore || "N/A"} (${result.iqScore || "N/A"} IQ)`,
          resourceType: "IQ Test",
          timestamp: result.completedAt || result.createdAt,
          ipAddress: "N/A",
          testResult: result.iqScore || "N/A",
        });
      });
    }

    // Sort all logs by timestamp
    activityLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const total = activityLogs.length;
    const paginatedLogs = activityLogs.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedLogs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: paginatedLogs.length,
        totalLogs: total,
      },
    });
  } catch (error) {
    console.error("Error fetching all activity logs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.logAdminAction = logAdminAction;
