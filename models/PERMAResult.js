const mongoose = require("mongoose");

const permaResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    default: null,
  },
  sessionId: {
    type: String,
    required: false,
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: ["temporary", "claimed"],
    default: "temporary",
  },
  scores: {
    P: { type: Number, default: 0 }, // Positive Emotion
    E: { type: Number, default: 0 }, // Engagement
    R: { type: Number, default: 0 }, // Relationships
    M: { type: Number, default: 0 }, // Meaning
    A: { type: Number, default: 0 }, // Accomplishment
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  wellbeingLevel: {
    type: String,
    enum: ["Low", "Moderate", "High", "Very High"],
    default: "Moderate",
  },
  responses: [
    {
      questionIndex: Number,
      answer: {
        type: Number,
        min: 0,
        max: 10,
      },
    },
  ],
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("PERMAResult", permaResultSchema);
