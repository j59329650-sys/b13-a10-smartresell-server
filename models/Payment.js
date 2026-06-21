const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    transactionId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    paymentStatus: { 
      type: String, 
      enum: ["pending", "success", "failed"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);