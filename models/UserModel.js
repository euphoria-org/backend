const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  auth0Id: {
    type: String,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ["google", "local"],
    default: "local",
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  mbtiResults: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MBTIResult",
    },
  ],
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("User", userSchema);
