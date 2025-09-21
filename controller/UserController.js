const UserModel = require("../models/UserModel");
const MBTIResult = require("../models/MBTIResult");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const {
  sendPasswordResetEmail,
  sendAccountConfirmationEmail,
} = require("../utils/emailService");

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }
    const user = new UserModel({
      name,
      email,
      password,
      authProvider: "local",
    });

    await user.save();
    const token = generateToken(user._id);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    try {
      await sendAccountConfirmationEmail(email, name);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. A confirmation email has been sent to your email address.",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    // Check if user has a password set (for Google users who have set a password)
    if (user.authProvider !== "local" && !user.password) {
      return res.status(400).json({
        success: false,
        message: `Please sign in with ${user.authProvider}`,
      });
    }

    // If Google user doesn't have a password set, require Google sign-in
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        success: false,
        message: "Please sign in with Google or reset your password to set one",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    const token = generateToken(user._id);
    const userResponse = { ...user.toObject() };
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user._id)
      .select("-password")
      .populate("mbtiResults");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user._id;
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    const existingUser = await UserModel.findOne({
      email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Allow password updates for all users, including Google OAuth users
    // For Google OAuth users, if they don't have a current password, we'll skip the current password check
    let isCurrentPasswordValid = true;

    if (user.authProvider === "local" || user.password) {
      // Only check current password if user has a password set (local users or Google users who set a password)
      isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password || ""
      );
    } else {
      // For Google users without a password, we'll require them to verify their identity differently
      // For now, we'll allow them to set a password without current password verification
      isCurrentPasswordValid = true;
    }

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await UserModel.findByIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset link has been sent",
      });
    }

    // Allow password reset for all users, including Google OAuth users
    // Google users can set a new password to use for future logins

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      res.status(200).json({
        success: true,
        message: "Password reset email sent successfully",
      });
    } catch (emailError) {
      console.error("Failed to send reset email:", emailError);
      res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (!newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirmation are required",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await UserModel.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
