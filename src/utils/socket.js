const { Server } = require("socket.io");
const { Chat } = require("../models/chat");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinChat", ({ firstName, targetUserId, loggedInUserId }) => {
      const room = [targetUserId, loggedInUserId].sort().join("_");
      console.log(
        `User ${loggedInUserId} joining room: ${room} with ${firstName}`
      );
      socket.join(room);
      // Confirm join back to the client for debugging
      socket.emit("joinedRoom", { room, socketId: socket.id });
    });
    socket.on(
      "sendMessage",
      async ({ firstName, targetUserId, loggedInUserId, text }) => {
        const room = [targetUserId, loggedInUserId].sort().join("_");
        try {
          let chat = await Chat.findOne({
            participants: { $all: [targetUserId, loggedInUserId] },
          });

          if (!chat) {
            chat = new Chat({
              participants: [targetUserId, loggedInUserId],
              messages: [],
            });
          }
          chat.messages.push({
            senderId: loggedInUserId,
            text,
          });
          await chat.save();
        } catch (err) {
          console.error("Error in sendMessage handler:", err);
        }
        const timestamp = new Date().toISOString();
        socket.to(room).emit("receiveMessage", {
          firstName,
          lastName,
          text,
          timestamp,
          senderId: loggedInUserId,
        });
      }
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};

module.exports = initializeSocket;
