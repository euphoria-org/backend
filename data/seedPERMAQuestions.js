const mongoose = require("mongoose");
const PERMAModel = require("../models/PERMAModel");
const permaQuestions = require("./permaQuestions.json");
require("dotenv").config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Seed PERMA questions
const seedPERMAQuestions = async () => {
  try {
    await connectDB();

    // Clear existing questions
    await PERMAModel.deleteMany({});
    console.log("Cleared existing PERMA questions");

    // Insert new questions
    const insertedQuestions = await PERMAModel.insertMany(permaQuestions);
    console.log(`Successfully inserted ${insertedQuestions.length} PERMA questions`);

    // Display summary by dimension
    const dimensions = ["P", "E", "R", "M", "A"];
    const dimensionNames = {
      P: "Positive Emotion",
      E: "Engagement",
      R: "Relationships",
      M: "Meaning",
      A: "Accomplishment",
    };

    console.log("\n=== Questions by Dimension ===");
    for (const dim of dimensions) {
      const count = insertedQuestions.filter((q) => q.dimension === dim).length;
      console.log(`  ${dimensionNames[dim]} (${dim}): ${count} questions`);
    }

    console.log("\n✓ PERMA questions seeded successfully!");
    console.log(`Total questions: ${insertedQuestions.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding PERMA questions:", error);
    process.exit(1);
  }
};

// Run the seeder
seedPERMAQuestions();
