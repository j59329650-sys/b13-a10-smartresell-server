import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { client, db } from './db.js'; 
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  "http://localhost:3000",
  "https://b13-a10-smartresell-client.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};


app.use(cors(corsOptions));


app.options('*', cors(corsOptions));


app.all("/api/auth/*", (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});


app.use("/api/auth", toNodeHandler(auth));


app.use(express.json());

app.get('/', (req, res) => {
  res.send('SmartResell Server is Running...');
});

async function run() {
  try {
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
    }

    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    
    app.post('/products', async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    
    app.get('/products', async (req, res) => {
      const { search, category, sort, page = 1, limit = 6 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      let query = { status: "available" };
      if (search) query.title = { $regex: search, $options: "i" };
      if (category) query.category = category;

      let sortOptions = {};
      if (sort === "lowToHigh") sortOptions.price = 1;
      if (sort === "highToLow") sortOptions.price = -1;

      const products = await productsCollection.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      const totalProducts = await productsCollection.countDocuments(query);

      res.send({
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: parseInt(page)
      });
    });

    
    app.post('/orders', async (req, res) => {
      const orderData = req.body;
      const result = await ordersCollection.insertOne(orderData);
      res.send(result);
    });

  } catch (error) {
    console.error("Database connection error:", error);
  }
}

run().catch(console.dir);

export default app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}