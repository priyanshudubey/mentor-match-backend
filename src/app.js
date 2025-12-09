const dotenv = require("dotenv");
const express = require("express");
const dbConn = require("./config/database");
const app = express();
var cookieParser = require("cookie-parser");
const cors = require("cors");
require("./utils/cronjob");
dotenv.config();

const corsOptions = {
  origin: "http://localhost:5173",
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

dbConn()
  .then(() => {
    console.log("Connected to DB sucessfully");
    app.listen(7777, () => {
      console.log("Server is running on: 7777");
    });
  })
  .catch((err) => {
    console.error("Can not connect to DB", err);
  });
