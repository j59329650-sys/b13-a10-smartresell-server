const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken"); 
require("dotenv").config();

const User = require("./models/User"); 
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://b13-a10-smartresell-client.vercel.app'], 
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("📦 MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ Database Connection Error:", err));

// -----------------------------------------------------------------
// STEP 2: AUTHENTICATION & JWT APIS
// -----------------------------------------------------------------


app.put("/users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;
    const filter = { email: email };
    const options = { upsert: true, new: true };
    
    const updateDoc = {
      $set: {
        name: user.name,
        email: user.email,
        photo: user.photo || "",
        role: user.role || "buyer",
      },
    };

  
    const result = await User.findOneAndUpdate(filter, updateDoc, options);

    
    const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "1d",
    });

    
    res.send({ success: true, result, token });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});


const verifyToken = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
  const token = req.headers.authorization.split(" ")[1];
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, data: savedProduct });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ২. হোম পেজ ও অল-প্রোডাক্টস পেজের জন্য সব প্রোডাক্ট গেট করার API (GET)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }); // নতুনগুলো আগে দেখাবে
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// -----------------------------------------------------------------

app.get("/", (req, res) => {
  res.send("SmartResell Server is Running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});