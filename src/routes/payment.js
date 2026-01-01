const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorPay");
const Payment = require("../models/payments");
const membershipAmount = require("../utils/constants").membershipAmount;
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, email } = req.user;
    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType] * 100,
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
      partial_payment: false,
      notes: {
        firstName,
        lastName,
        email,
        membershipType: membershipType,
      },
    });
    const payment = new Payment({
      userId: req.user._id,
      paymentId: null,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
      status: order.status,
    });

    const savedPayment = await payment.save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      req.headers["x-razorpay-signature"],
      process.env.RAZORPAY_WEBHOOK_SECRET
    );
    if (!isWebhookValid) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }
    const paymentDetails = req.body.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    payment.status = paymentDetails.status;
    await payment.save();

    const user = await User.findOne({ _id: payment.userId });
    user.isPremium = true;
    user.membershipType = paymentDetails.notes.membershipType;
    await user.save();

    return res.status(200).json({ message: "Webhook processed successfully" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user.toJSON();
  if (user.isPremium) {
    return res.json({ isPremium: true, membershipType: user.membershipType });
  } else {
    return res.json({ isPremium: false });
  }
});

module.exports = paymentRouter;
