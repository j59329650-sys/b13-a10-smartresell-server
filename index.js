import express from 'express';
import cors from 'cors';
import { ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { client, db } from './db.js'; 
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS এবং মিডলওয়্যার কনফিগারেশন
app.use(cors({
  origin: ['http://localhost:3000', 'https://b13-a10-smartresell-client.vercel.app'],
  credentials: true
}));
app.use(express.json());

// রুট বা হোম পাথ টেস্ট করার জন্য
app.get('/', (req, res) => {
  res.send('SmartResell Server is Running...');
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully! 🚀");

    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");
    const paymentsCollection = db.collection("payments");

    // Better Auth মিডলওয়্যার
    app.use("/api/auth/*", toNodeHandler(auth));

    // প্রোডাক্ট তৈরি করা (POST)
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // প্রোডাক্ট খোঁজা, সর্টিং এবং পেজিনেশন (GET)
    app.get('/products', async (req, res) => {
      const search = req.query.search || "";
      const category = req.query.category || "";
      const sort = req.query.sort;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 6;
      const skip = (page - 1) * limit;

      let query = { status: "available" };
      if (search) {
        query.title = { $regex: search, $options: "i" }; 
      }
      if (category) {
        query.category = category;
      }

      let sortOptions = {};
      if (sort === "lowToHigh") sortOptions.price = 1;
      if (sort === "highToLow") sortOptions.price = -1;

      const cursor = productsCollection.find(query).sort(sortOptions).skip(skip).limit(limit);
      const products = await cursor.toArray();
      const totalProducts = await productsCollection.countDocuments(query);

      res.send({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page
      });
    });

    // নির্দিষ্ট একটি প্রোডাক্ট দেখা (GET)
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; 
      const product = await productsCollection.findOne(query);
      res.send(product);
    });

    // অর্ডার তৈরি করা (POST)
    app.post('/orders', async (req, res) => {
      const orderData = req.body;
      const result = await ordersCollection.insertOne(orderData);
      res.send(result);
    });

    // ক্রেতার ইমেইল অনুযায়ী অর্ডার লিস্ট দেখা (GET)
    app.get('/orders/buyer/:email', async (req, res) => {
      const email = req.params.email;
      const query = { "buyerInfo.email": email };
      const result = await ordersCollection.find(query).toArray();
      res.send(result);
    });

  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

// সার্ভার চালু করার কোড (এখানে বড় হাতের PORT ব্যবহার করা হয়েছে)
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});