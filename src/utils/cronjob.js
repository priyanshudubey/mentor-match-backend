const cron = require("node-cron");
const sendEmail = require("./sendEmail");
const ConnectionRequestModel = require("../models/connectionRequest");

//cron job to send email every day 8 AM for all the match request each user's have received
cron.schedule("19 23 * * *", async () => {
  try {
    const pendingRequests = await ConnectionRequestModel.find({
      status: "interested",
      createdAt: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate("fromUserId toUserId");

    const listOfEmails = [
      ...new Set(
        pendingRequests
          .filter((request) => request.toUserId && request.toUserId.emailId) // Filter out null toUserId
          .map((request) => request.toUserId.emailId)
      ),
    ];

    console.log("List of emails to send match requests: ", listOfEmails);

    for (const email of listOfEmails) {
      {
        try {
          const res = await sendEmail.run(
            email,
            "You have new match requests pending for " + email,
            "There are multiple users interested in connecting with you. Please log in to your Mentor Match account to view and respond to these requests."
          );
          console.log(`Email sent to ${email}: `, res);
        } catch (error) {
          console.error(`Error sending email to ${email}: `, error);
        }
      }
    }
  } catch (error) {
    console.error("Error sending match request emails:", error);
  }
});
