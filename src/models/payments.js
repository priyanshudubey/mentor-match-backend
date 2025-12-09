const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    receipt: {
      type: String,
      required: true,
    },
    notes: {
      firstName: { type: String },
      lastName: { type: String },
      membershipType: { type: String },
    },
    status: {
      type: String,
      required: true,
      default: "created",
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model("Payment", paymentSchema);
