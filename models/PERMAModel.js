const mongoose = require("mongoose");

const permaSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  dimension: {
    type: String,
    required: true,
    enum: ["P", "E", "R", "M", "A"], // P: Positive Emotion, E: Engagement, R: Relationships, M: Meaning, A: Accomplishment
  },
  dimensionName: {
    type: String,
    required: true,
    enum: [
      "Positive Emotion",
      "Engagement",
      "Relationships",
      "Meaning",
      "Accomplishment",
    ],
  },
  scoreDirection: {
    type: String,
    required: true,
    enum: ["+", "-"], // + for positive scoring, - for reverse scoring
  },
  order: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("PERMA", permaSchema);
