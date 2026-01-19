const express = require("express");
const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const { validateEditProfileData } = require("../utils/validation");
const bcrypt = require("bcrypt");

//Get profile api
profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user.toObject ? req.user.toObject() : req.user;
    // Ensure firstName always exists
    if (!user.firstName) {
      user.firstName = "User";
    }
    res.send(user);
  } catch (err) {
    res.status(400).send("Error occured " + err.message);
  }
});

//Update profile api
profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    const isValid = validateEditProfileData(req.body);
    if (!isValid) {
      return res.status(400).send("Invalid or unexpected fields");
    }
    const newData = req.body;
    const doc = await User.findOneAndUpdate(
      { _id: req.user._id },
      { $set: newData },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!doc) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(doc);
  } catch (err) {
    res.status(400).send("Error occured " + err.message);
  }
});

//update password
profileRouter.patch("/profile/password", userAuth, async (req, res) => {
  try {
    const { password: currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and New Password required" });
    }

    if (currentPassword == newPassword) {
      return res
        .status(400)
        .json({ error: "Current and New Password can not be same!" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error("Please enter correct Current Password!");
    }
    const hashPassword = await bcrypt.hash(newPassword, 10);
    const ok = await User.findByIdAndUpdate(
      { _id: user.id },
      { $set: { password: hashPassword } },
      { runValidators: true }
    );
    return res.json({ message: "Password Updated Sucessfully!" });
  } catch (err) {
    res.status(400).send("Error occured " + err.message);
  }
});

module.exports = profileRouter;
