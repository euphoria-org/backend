const jwt = require("jsonwebtoken");
const AdminModel = require("../models/AdminModel");
const UserModel = require("../models/UserModel");
exports.verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for admin by looking for adminId field or checking the user type
    const admin = await AdminModel.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Admin privileges required.",
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
exports.verifyUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is for user by looking for user in UserModel
    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User privileges required.",
      });
    }

    req.user = user;
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

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // First try to find user in AdminModel, then in UserModel
    let user;
    let userType;

    user = await AdminModel.findById(decoded.id).select("-password");
    if (user) {
      req.admin = user;
      userType = "admin";
    } else {
      user = await UserModel.findById(decoded.id).select("-password");
      if (user) {
        req.user = user;
        userType = "user";
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.authenticatedUser = user;
    req.userRole = userType;
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
