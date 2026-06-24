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


app.use(cors({
  origin: ["http://localhost:3000", "https://vercel.com/j59329650-sys-projects/b13-a10-smartresell-client/FQT54qhYrVU1xbvvVwmE2qfMgh7g"], 
  credentials: true,
}));
app.use(express.json());


app.get('/', (req, res) => {
  res.send('SmartResell Server is Running...');
});

async function run() {
  try {
    await client.connect();
    console.log("MongoDB connected successfully! ");

    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");
    const paymentsCollection = db.collection("payments");

    
    app.use("/api/auth/*", toNodeHandler(auth));


    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    
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

    
    app.get('/products/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }; 
      const product = await productsCollection.findOne(query);
      res.send(product);
    });

  
    app.post('/orders', async (req, res) => {
      const orderData = req.body;
      const result = await ordersCollection.insertOne(orderData);
      res.send(result);
    });

    
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


app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});