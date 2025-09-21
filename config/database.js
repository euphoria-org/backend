const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose
      .connect(`${process.env.MONGO_URL}/euphoria`)
      .then(() => {
        console.log("MongoDB connected");
      })
      .catch((err) => console.log(err));
  } catch (error) {}
};

module.exports = connectDB;
