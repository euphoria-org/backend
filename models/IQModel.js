const mongoose = require("mongoose");

const iqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Logical Reasoning",
      "Pattern Recognition",
      "Verbal Comprehension",
      "Numerical Ability",
      "Spatial Reasoning",
    ],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["Easy", "Medium", "Hard"],
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
  },
  points: {
    type: Number,
    required: true,
    default: 1,
  },
  order: {
    type: Number,
    required: true,
  },
  explanation: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("IQ", iqSchema);
