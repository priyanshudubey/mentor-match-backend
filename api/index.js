const app = require("../src/app");
const dbConn = require("../src/config/database");

// Ensure database connection before handling requests
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await dbConn();
    isConnected = true;
    console.log("Connected to DB successfully");
  } catch (err) {
    console.error("Cannot connect to DB", err);
  }
};

// Connect on cold start
connectDB();

module.exports = app;
