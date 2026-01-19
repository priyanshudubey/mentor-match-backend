const dotenv = require("dotenv");
const express = require("express");
const dbConn = require("../src/config/database");
const app = express();
var cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const initializeSocket = require("../src/utils/socket");

require("../src/utils/cronjob");

dotenv.config();

const server = http.createServer(app);
initializeSocket(server);

const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

const authRouter = require("../src/routes/auth");
const profileRouter = require("../src/routes/profile");
const requestRouter = require("../src/routes/requests");
const userRouter = require("../src/routes/user");
const paymentRouter = require("../src/routes/payment");
const postRouter = require("../src/routes/post");
const chatRouter = require("../src/routes/chat");

app.use("/api", authRouter);
app.use("/api", profileRouter);
app.use("/api", requestRouter);
app.use("/api", userRouter);
app.use("/api", paymentRouter);
app.use("/api", postRouter);
app.use("/api", chatRouter);

app.get("/", (req, res) => {
  res.json("Hello");
});

dbConn()
  .then(() => console.log("DB Connection initiated"))
  .catch((err) => console.error("DB Connection Error", err));

if (process.env.NODE_ENV !== "production") {
  server.listen(7777, () => {
    console.log("Server is running locally on: 7777");
  });
}

module.exports = server;
