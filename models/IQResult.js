const mongoose = require("mongoose");

const iqResultSchema = new mongoose.Schema({
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
  iqScore: {
    type: Number,
    required: true,
    min: 0,
    max: 200,
  },
  iqLevel: {
    type: String,
    enum: [
      "Below Average",
      "Average",
      "Above Average",
      "Superior",
      "Very Superior",
      "Genius",
    ],
    required: true,
  },
  categoryScores: {
    "Logical Reasoning": { type: Number, default: 0 },
    "Pattern Recognition": { type: Number, default: 0 },
    "Verbal Comprehension": { type: Number, default: 0 },
    "Numerical Ability": { type: Number, default: 0 },
    "Spatial Reasoning": { type: Number, default: 0 },
  },
  totalCorrect: {
    type: Number,
    required: true,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  rawScore: {
    type: Number,
    required: true,
    default: 0,
  },
  percentile: {
    type: Number,
    min: 0,
    max: 100,
  },
  responses: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "IQ",
      },
      questionIndex: Number,
      selectedAnswer: Number,
      isCorrect: Boolean,
      points: Number,
    },
  ],
  timeTaken: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IQResult", iqResultSchema);
