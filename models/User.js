const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    photo: { type: String, default: "" },
    role: { 
      type: String, 
      enum: ["buyer", "seller", "admin"], 
      default: "buyer" 
    },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    status: { 
      type: String, 
      enum: ["active", "blocked"], 
      default: "active" 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);