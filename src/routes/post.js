const express = require("express");
const { userAuth } = require("../middlewares/auth");
const Post = require("../models/post");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");

const postRouter = express.Router();

// Create a new post
postRouter.post("/post/create", userAuth, async (req, res) => {
  try {
    const { content, mediaUrl } = req.body;
    const authorId = req.user._id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Post content cannot be empty!" });
    }

    const post = new Post({
      authorId,
      content,
      mediaUrl: mediaUrl || null,
    });

    const savedPost = await post.save();
    const populatedPost = await Post.findById(savedPost._id).populate(
      "authorId",
      "firstName lastName photoURL membershipType"
    );

    return res.json({
      message: "Post created successfully!",
      data: populatedPost,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Get feed posts from connections
postRouter.get("/post/feed", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all accepted connections for this user
    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: userId, status: "accepted" },
        { toUserId: userId, status: "accepted" },
      ],
    });

    // Extract connected user IDs
    const connectedUserIds = connections.map((conn) => {
      return conn.fromUserId.toString() === userId.toString()
        ? conn.toUserId
        : conn.fromUserId;
    });

    // Include the user's own posts
    connectedUserIds.push(userId);

    // Get posts from connections
    const posts = await Post.find({ authorId: { $in: connectedUserIds } })
      .populate("authorId", "firstName lastName photoURL membershipType")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      message: "Posts fetched successfully!",
      data: posts,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Like a post
postRouter.post("/post/:postId/like", userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({ message: "Post not found!" });
    }

    // Check if user already liked the post
    if (post.likes.includes(userId)) {
      // Unlike the post
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      // Like the post
      post.likes.push(userId);
    }

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id)
      .populate("authorId", "firstName lastName photoURL membershipType")
      .populate("comments.userId", "firstName lastName photoURL");

    return res.json({
      message: "Post like toggled successfully!",
      data: populatedPost,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Add comment to a post
postRouter.post("/post/:postId/comment", userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: "Comment cannot be empty!" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({ message: "Post not found!" });
    }

    post.comments.push({
      userId,
      text,
    });

    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id)
      .populate("authorId", "firstName lastName photoURL membershipType")
      .populate("comments.userId", "firstName lastName photoURL");

    return res.json({
      message: "Comment added successfully!",
      data: populatedPost,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Get a single post with all details
postRouter.get("/post/:postId", userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId)
      .populate("authorId", "firstName lastName photoURL membershipType")
      .populate("comments.userId", "firstName lastName photoURL");

    if (!post) {
      return res.status(400).json({ message: "Post not found!" });
    }

    return res.json({
      message: "Post fetched successfully!",
      data: post,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Edit a post (only author can edit)
postRouter.put("/post/:postId", userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: "Post content cannot be empty!" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({ message: "Post not found!" });
    }

    if (post.authorId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts!" });
    }

    post.content = content;
    const updatedPost = await post.save();
    const populatedPost = await Post.findById(updatedPost._id)
      .populate("authorId", "firstName lastName photoURL membershipType")
      .populate("comments.userId", "firstName lastName photoURL");

    return res.json({
      message: "Post updated successfully!",
      data: populatedPost,
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Delete a post (only author can delete)
postRouter.delete("/post/:postId", userAuth, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(400).json({ message: "Post not found!" });
    }

    if (post.authorId.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts!" });
    }

    await Post.findByIdAndDelete(postId);

    return res.json({
      message: "Post deleted successfully!",
    });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// Edit a comment (only comment author can edit)
postRouter.put(
  "/post/:postId/comment/:commentId",
  userAuth,
  async (req, res) => {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;
      const userId = req.user._id;
      const { text } = req.body;

      if (!text || text.trim().length === 0) {
        return res.status(400).json({ message: "Comment cannot be empty!" });
      }

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(400).json({ message: "Post not found!" });
      }

      const comment = post.comments.find((c) => c._id.toString() === commentId);
      if (!comment) {
        return res.status(400).json({ message: "Comment not found!" });
      }

      if (comment.userId.toString() !== userId.toString()) {
        return res
          .status(403)
          .json({ message: "You can only edit your own comments!" });
      }

      comment.text = text;
      const updatedPost = await post.save();
      const populatedPost = await Post.findById(updatedPost._id)
        .populate("authorId", "firstName lastName photoURL membershipType")
        .populate("comments.userId", "firstName lastName photoURL");

      return res.json({
        message: "Comment updated successfully!",
        data: populatedPost,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

// Delete a comment (post owner or comment author can delete)
postRouter.delete(
  "/post/:postId/comment/:commentId",
  userAuth,
  async (req, res) => {
    try {
      const postId = req.params.postId;
      const commentId = req.params.commentId;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(400).json({ message: "Post not found!" });
      }

      const commentIndex = post.comments.findIndex(
        (c) => c._id.toString() === commentId
      );
      if (commentIndex === -1) {
        return res.status(400).json({ message: "Comment not found!" });
      }

      const comment = post.comments[commentIndex];
      const isPostOwner = post.authorId.toString() === userId.toString();
      const isCommentAuthor = comment.userId.toString() === userId.toString();

      if (!isPostOwner && !isCommentAuthor) {
        return res.status(403).json({
          message:
            "You can only delete your own comments or comments on your own posts!",
        });
      }

      post.comments.splice(commentIndex, 1);
      const updatedPost = await post.save();
      const populatedPost = await Post.findById(updatedPost._id)
        .populate("authorId", "firstName lastName photoURL membershipType")
        .populate("comments.userId", "firstName lastName photoURL");

      return res.json({
        message: "Comment deleted successfully!",
        data: populatedPost,
      });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }
);

module.exports = postRouter;
