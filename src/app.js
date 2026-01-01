const dotenv = require("dotenv");
const express = require("express");
const dbConn = require("./config/database");
const app = express();
var cookieParser = require("cookie-parser");
const cors = require("cors");

// WARNING: Cron jobs (node-cron) generally DO NOT work on Vercel/Serverless
// because the server "sleeps" when no one is using it.
require("./utils/cronjob");

dotenv.config();

const corsOptions = {
  // Use environment variable for production, fallback to localhost for dev
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);

app.get("/", (req, res) => {
  res.json("Hello");
});

// Trigger DB Connection
// In serverless, we call this immediately. Mongoose (if used) buffers requests
// until the connection is ready, so we don't need to block the app export.
dbConn()
  .then(() => console.log("DB Connection initiated"))
  .catch((err) => console.error("DB Connection Error", err));

// LOCAL DEV ONLY: Start the server manually
// Vercel sets NODE_ENV to 'production' by default
if (process.env.NODE_ENV !== "production") {
  app.listen(7777, () => {
    console.log("Server is running locally on: 7777");
  });
}

// REQUIRED FOR VERCEL
module.exports = app;
