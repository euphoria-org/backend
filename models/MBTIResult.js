const mongoose = require("mongoose");

const mbtiResultSchema = new mongoose.Schema({
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
  mbtiType: {
    type: String,
    required: true,
    enum: [
      "INTJ",
      "INTP",
      "ENTJ",
      "ENTP",
      "INFJ",
      "INFP",
      "ENFJ",
      "ENFP",
      "ISTJ",
      "ISFJ",
      "ESTJ",
      "ESFJ",
      "ISTP",
      "ISFP",
      "ESTP",
      "ESFP",
    ],
  },
  scores: {
    E: { type: Number, default: 0 },
    I: { type: Number, default: 0 },
    S: { type: Number, default: 0 },
    N: { type: Number, default: 0 },
    T: { type: Number, default: 0 },
    F: { type: Number, default: 0 },
    J: { type: Number, default: 0 },
    P: { type: Number, default: 0 },
  },
  responses: [
    {
      questionIndex: Number,
      answer: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  ],
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MBTIResult", mbtiResultSchema);
