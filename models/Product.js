const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  condition: { type: String, enum: ['Used', 'Like New', 'Refurbished'], required: true },
  price: { type: Number, required: true },
  images: [{ type: String, required: true }], // ছবির URL এর অ্যারে
  description: { type: String, required: true },
  sellerInfo: {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
  },
  status: { type: String, enum: ['available', 'sold'], default: 'available' },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);