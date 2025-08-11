const AdminModel = require("../models/AdminModel");
const AdminLog = require("../models/AdminLog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET || "your-secret-key",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

// Helper function to log admin actions
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

    // Also log to console for immediate monitoring
    const timestamp = new Date().toISOString();
    console.log(
      `[ADMIN ACTION] ${timestamp} - Admin ${adminId} performed ${action} on ${resourceType}${
        resourceId ? ` (ID: ${resourceId})` : ""
      }${details ? ` - ${details}` : ""}`
    );
  } catch (error) {
    console.error("Error logging admin action:", error);
  }
};

// Admin login (only route needed for frontend)
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await AdminModel.findByIdAndUpdate(admin._id, {
      lastLogin: new Date(),
    });

    // Log login action
    await logAdminAction(
      admin._id,
      "LOGIN",
      "Admin Session",
      null,
      `Login successful`,
      req.ip || "Unknown"
    );

    // Generate JWT token
    const token = generateToken(admin._id);

    // Remove password from response
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

// Get current admin profile
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

// Get admin activity logs
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

// Export the logging function for use in other controllers
exports.logAdminAction = logAdminAction;
