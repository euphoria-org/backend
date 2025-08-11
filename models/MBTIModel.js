const mongoose = require("mongoose");

const mbtiSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  positiveLetter: {
    type: String,
    required: true,
  },
  negativeLetter: {
    type: String,
    required: true,
  },
  scoreDirection: {
    type: String,
    required: true,
  },
  dimensionName: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  }
});

module.exports = mongoose.model("MBTI", mbtiSchema);
