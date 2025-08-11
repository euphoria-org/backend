const mongoose = require("mongoose");

const AdminLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["LOGIN", "CREATE", "UPDATE", "DELETE", "VIEW"],
    },
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
AdminLogSchema.index({ adminId: 1, timestamp: -1 });
AdminLogSchema.index({ action: 1, timestamp: -1 });

const AdminLog = mongoose.model("AdminLog", AdminLogSchema);
module.exports = AdminLog;
