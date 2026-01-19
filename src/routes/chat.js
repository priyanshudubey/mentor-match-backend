const express = require("express");
const { Chat } = require("../models/chat");
const { userAuth } = require("../middlewares/auth");
const ChatRouter = express.Router();

ChatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const loggedInUserId = req.user.id;
    console.log("Logged in user ID:", loggedInUserId);
    let chat = await Chat.findOne({
      participants: { $all: [targetUserId, loggedInUserId] },
    }).populate({
      path: "messages.senderId",
      select: "firstName lastName photoURL",
    });
    if (!chat) {
      chat = new Chat({
        participants: [targetUserId, loggedInUserId],
        messages: [],
      });
      await chat.save();
    }

    return res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = ChatRouter;
