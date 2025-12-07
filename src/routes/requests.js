const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const sendEmail = require("../utils/sendEmail");

const requestRouter = express.Router();

// send connection request api
requestRouter.post(
  "/request/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const toUserId = req.params.toUserId;
      const status = req.params.status;

      if (fromUserId == toUserId) {
        return res
          .status(400)
          .json({ message: "You can send the request to yourself!" });
      }

      const allowedStatus = ["ignored", "interested"];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid Status: " + status });
      }

      const checkUser = await User.findById(toUserId);
      if (!checkUser) {
        return res.status(400).json({ message: "User does not exist!" });
      }

      const existingConnectionRequest = await ConnectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { toUserId: fromUserId, fromUserId: toUserId },
        ],
      });

      if (existingConnectionRequest) {
        return res
          .status(400)
          .json({ message: "Connection request already exist!" });
      }

      const connectionRequest = new ConnectionRequest({
        fromUserId,
        toUserId,
        status,
      });

      const data = await connectionRequest.save();
      const emailRes = await sendEmail.run();
      console.log("Email send response: ", emailRes);

      return res.json({
        message: "Connection Request sent sucessfully!",
        data,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

// accept or reject the connection request
requestRouter.post(
  "/request/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const requestId = req.params.requestId;
      const status = req.params.status;
      const loggedInUser = req.user._id.toString();
      const allowedStatus = ["accepted", "rejected"];

      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid Status: " + status });
      }

      const availableRequest = await ConnectionRequest.findOne({
        _id: requestId,
        toUserId: loggedInUser,
        status: "interested",
      });

      if (availableRequest.length == 0) {
        return res.status(404).json({ message: "No connection request found" });
      }

      availableRequest.status = status;
      const data = await availableRequest.save();
      return res.json({
        message: `You have ${status} the connection request`,
        data,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

module.exports = requestRouter;
