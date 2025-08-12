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

    // Get total questions
    const totalQuestions = await MBTIModel.countDocuments();

    // Get total test completions
    const totalTests = await MBTIResult.countDocuments();

    // Get tests completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const testsToday = await MBTIResult.countDocuments({
      completedAt: { $gte: today },
    });

    // Get tests completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const testsThisWeek = await MBTIResult.countDocuments({
      completedAt: { $gte: weekAgo },
    });

    // Get most common MBTI type
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
      {
        $limit: 1,
      },
    ]);

    const mostCommonType =
      typeDistribution.length > 0 ? typeDistribution[0] : null;

    res.status(200).json({
      success: true,
      data: {
        totalQuestions,
        totalTests,
        testsToday,
        testsThisWeek,
        mostCommonType,
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

exports.logAdminAction = logAdminAction;
