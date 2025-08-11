const express = require("express");
const app = express();
const connectDB = require("./config/database");
require("dotenv").config();

app.use(express.json());
const cors = require("cors");
app.use(cors());

const MBTIRouter = require("./routes/MBTIRouter");
const AdminRouter = require("./routes/AdminRouter");

const port = process.env.PORT || 8080;
connectDB();

app.use("/api/mbti", MBTIRouter);
app.use("/api/admin", AdminRouter);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
