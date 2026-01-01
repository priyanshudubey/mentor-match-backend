const express = require("express");
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validation");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    validateSignupData(req);
    const { firstName, lastName, emailId, password } = req.body;
    const hashPassowrd = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: hashPassowrd,
    });
    await user.save({
      runValidators: true,
    });
    res.send("User details added sucessfully!");
  } catch (err) {
    res.status(400).send("Error adding user details: " + err.message);
  }
});

//Login api
authRouter.post("/login", async (req, res) => {
  try {
    validateLoginData(req);
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId }).select("+password");

    const isProduction = process.env.NODE_ENV === "production";

    if (!user) {
      throw new Error("Invalid credentials!!");
    }
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid Credentials!");
    }
    const token = await user.getJWT();
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      expires: new Date(Date.now() + 8 * 3600000), // 8 hours
    });

    return res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

//logout api
authRouter.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out" });
});

module.exports = authRouter;
