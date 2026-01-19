const express = require("express");
const User = require("../models/user");
const connectionRequest = require("../models/connectionRequest");
const { userAuth } = require("../middlewares/auth");
const { Connection, set } = require("mongoose");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName photoURL age gender about skills";

//get all the pending connection request
userRouter.get("/user/requests", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const availableRequest = await connectionRequest
      .find({
        toUserId: loggedInUser,
        status: "interested",
      })
      .populate("fromUserId", USER_SAFE_DATA);

    if (!availableRequest) {
      return res.status(404).json({ message: "No pending connection request" });
    }
    return res.json({
      message: "You have these pending connection requests: ",
      availableRequest,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

//get all the connection
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const availableConnection = await connectionRequest
      .find({
        $or: [{ toUserId: loggedInUser }, { fromUserId: loggedInUser }],
        status: "accepted",
      })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    if (!availableConnection) {
      return res.status(404).json({ message: "No connections available" });
    }

    // Normalize logged-in user id to string for safe comparison
    const loggedInUserId = String(loggedInUser);

    const mapped = availableConnection.map((row) => {
      const fromId =
        row.fromUserId && row.fromUserId._id
          ? String(row.fromUserId._id)
          : String(row.fromUserId);
      const toId =
        row.toUserId && row.toUserId._id
          ? String(row.toUserId._id)
          : String(row.toUserId);

      if (fromId === loggedInUserId) {
        return row.toUserId;
      }
      return row.fromUserId;
    });

    // dedupe by _id
    const deduped = mapped.filter((v, i, arr) => {
      if (!v) return false;
      const id = String(v._id || v);
      return arr.findIndex((x) => String(x._id || x) === id) === i;
    });

    return res.json({
      message: "These are your connections:",
      rawCount: availableConnection.length,
      mappedCount: mapped.length,
      dedupedCount: deduped.length,
      data: deduped,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

//User's feed api
userRouter.get("/feed", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user._id;
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;

    const skip = (page - 1) * limit;

    const allRequests = await connectionRequest
      .find({
        $or: [{ toUserId: loggedInUser }, { fromUserId: loggedInUser }],
      })
      .select("fromUserId toUserId");

    const hideFromFeed = new Set();
    allRequests.forEach((req) => {
      hideFromFeed.add(req.fromUserId.toString());
      hideFromFeed.add(req.toUserId.toString());
    });

    const user = await User.find({
      $and: [
        { _id: { $nin: Array.from(hideFromFeed) } },
        { _id: { $ne: loggedInUser } },
      ],
    })
      .select(USER_SAFE_DATA)
      .skip(skip)
      .limit(limit);

    return res.json({
      message: "these are your connection requests: ",
      user,
    });
  } catch (err) {
    return res.status(400).json({ message: "Error coming from here" });
  }
});

// Get user by ID
userRouter.get("/user/:userId", userAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select(USER_SAFE_DATA);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = userRouter;
