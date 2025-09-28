const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["user", "assistant", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxLength: 10000,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const chatConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      maxLength: 200,
      default: "New Conversation",
    },
    messages: [messageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    sessionId: {
      type: String,
      required: false,
      default: null,
      index: true,
    },
    metadata: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      lastActivity: {
        type: Date,
        default: Date.now,
      },
      tags: [
        {
          type: String,
          maxLength: 50,
        },
      ],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

chatConversationSchema.pre("save", function (next) {
  if (this.isModified("messages")) {
    this.metadata.totalMessages = this.messages.length;
    this.metadata.lastActivity = new Date();
  }
  next();
});

chatConversationSchema.index({ userId: 1, updatedAt: -1 });
chatConversationSchema.index({ sessionId: 1, updatedAt: -1 });
chatConversationSchema.index({ createdAt: 1 });

chatConversationSchema.statics.findByUserOrSession = function (
  userId,
  sessionId
) {
  const query = {};
  if (userId) {
    query.userId = userId;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    query.userId = null;
    query.sessionId = null;
  }
  return this.find(query).sort({ updatedAt: -1 });
};

chatConversationSchema.methods.addMessage = function (role, content) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
  });
  return this;
};

chatConversationSchema.methods.getRecentMessages = function (limit = 10) {
  return this.messages.slice(-limit);
};

chatConversationSchema.virtual("summary").get(function () {
  if (this.messages.length === 0) {
    return "No messages yet";
  }

  const lastMessage = this.messages[this.messages.length - 1];
  const preview = lastMessage.content.substring(0, 100);
  return preview + (lastMessage.content.length > 100 ? "..." : "");
});

chatConversationSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("ChatConversation", chatConversationSchema);
