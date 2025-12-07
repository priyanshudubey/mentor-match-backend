const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("./sesClient");
const { create } = require("../models/user");

const createSendEmailCommand = (toAddress, fromAddress, subject, body) => {
  return new SendEmailCommand({
    Destination: {
      CcAddresses: [],
      ToAddresses: [toAddress],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: body,
        },
        Text: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
    Source: fromAddress,
    ReplyToAddresses: [],
  });
};

const run = async (toAddress, subject, body) => {
  const emailCommand = createSendEmailCommand(
    "priyanshu0dubey@gmail.com",
    "priyanshu@develevator.me",
    subject,
    body
  );
  try {
    return await sesClient.send(emailCommand);
  } catch (error) {
    if (error instanceof Error && error.name === "MessageRejected") {
      const MessageRejectedError = new Error(
        "Email address is not verified. Please verify the email address and try again."
      );
      return MessageRejectedError;
    }
    throw error;
  }
};

module.exports = { run };
