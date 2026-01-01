const { SESClient } = require("@aws-sdk/client-ses");

const REGION = "eu-north-1";
const sesClient = new SESClient({
  region: REGION,
  credentials: {
    accessKeyId: process.env.MENTOR_MATCH_AWS_SECRET_KEY,
    secretAccessKey: process.env.MENTOR_MATCH_AWS_SECRET_ACCESS_KEY,
  },
});
module.exports = { sesClient };
