const AdminModel = require("../models/AdminModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
exports.createAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (username, email, password)",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    const existingAdmin = await AdminModel.findOne({
      $or: [{ email }, { username }],
    });
    if (existingAdmin) {
      return res.status(400).json({
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
    const token = generateToken(savedAdmin._id);
    const adminResponse = {
      id: savedAdmin._id,
      username: savedAdmin.username,
      email: savedAdmin.email,
      createdAt: savedAdmin.createdAt,
    };
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      token,
      admin: adminResponse,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
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
    const token = generateToken(admin._id);
    
    // Log login action
    await AdminModel.findByIdAndUpdate(admin._id, {
      $push: {
        logs: {
          action: 'LOGIN',
          resourceType: 'Admin Session',
          timestamp: new Date(),
          details: `Login from IP: ${req.ip || 'Unknown'}`
        }
      }
    });
    
    const adminResponse = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
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

exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID format",
      });
    }

    const existingAdmin = await AdminModel.findById(id);
    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const updateData = {};

    if (username !== undefined) {
      if (!username.trim()) {
        return res.status(400).json({
          success: false,
          message: "Username cannot be empty",
        });
      }

      const usernameExists = await AdminModel.findOne({
        username,
        _id: { $ne: id },
      });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      updateData.username = username;
    }

    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const emailExists = await AdminModel.findOne({
        email,
        _id: { $ne: id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      updateData.email = email;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedAdmin = await AdminModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: updatedAdmin,
      updatedFields: Object.keys(updateData),
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }
    const admin = await AdminModel.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    await AdminModel.findByIdAndUpdate(adminId, {
      password: hashedNewPassword,
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin ID format",
      });
    }
    if (req.admin && req.admin.id === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }
    const deletedAdmin = await AdminModel.findByIdAndDelete(id);
    if (!deletedAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      data: {
        id: deletedAdmin._id,
        username: deletedAdmin.username,
        email: deletedAdmin.email,
      },
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    const admin = await AdminModel.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Admin not found.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Token verification failed.",
      error: error.message,
    });
  }
};

// Get admin logs (for current admin or specific admin)
exports.getAdminLogs = async (req, res) => {
  try {
    const { adminId } = req.params;
    const currentAdminId = req.admin._id;
    
    let query = {};
    
    // If adminId is provided, get logs for specific admin, otherwise get current admin's logs
    if (adminId) {
      // Validate admin ID format
      if (!adminId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin ID format",
        });
      }
      query._id = adminId;
    } else {
      query._id = currentAdminId;
    }

    const admin = await AdminModel.findOne(query)
      .select('username email logs')
      .lean();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Sort logs by timestamp (newest first)
    const sortedLogs = admin.logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        adminInfo: {
          id: admin._id,
          username: admin.username,
          email: admin.email
        },
        logs: sortedLogs,
        totalLogs: sortedLogs.length
      }
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

// Get all admin logs (super admin feature)
exports.getAllAdminLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const admins = await AdminModel.find()
      .select('username email logs')
      .lean();

    // Flatten all logs from all admins
    let allLogs = [];
    admins.forEach(admin => {
      admin.logs.forEach(log => {
        allLogs.push({
          ...log,
          adminInfo: {
            id: admin._id,
            username: admin.username,
            email: admin.email
          }
        });
      });
    });

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedLogs = allLogs.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginatedLogs,
      pagination: {
        current: page,
        total: Math.ceil(allLogs.length / limit),
        count: paginatedLogs.length,
        totalLogs: allLogs.length
      }
    });

  } catch (error) {
    console.error("Error fetching all admin logs:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
