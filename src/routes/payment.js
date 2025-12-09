const express = require("express");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../utils/razorPay");
const Payment = require("../models/payments");
const membershipAmount = require("../utils/constants").membershipAmount;

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

module.exports = paymentRouter;
