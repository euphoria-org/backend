const express = require('express');
const app = express();
const connectDB = require('./config/database');
require('dotenv').config();
app.use(express.json());


const port = process.env.PORT || 8080;

connectDB();
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});