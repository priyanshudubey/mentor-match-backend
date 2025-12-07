const { SESClient } = require("@aws-sdk/client-ses");

const REGION = "eu-north-1";
const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_SECRET_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
module.exports = { sesClient };
