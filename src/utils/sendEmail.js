const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const run = async (toAddress, subject, body) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "Mentor Match <onboarding@resend.dev>", // Replace with your verified domain
      to: [toAddress],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Email sent successfully:", data);
    return data;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

module.exports = { run };
