import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { client, db } from "./db.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;


const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://b13-a10-smartresell-client.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

app.use(cors(corsOptions));


app.options("*", cors(corsOptions));


app.all("/api/auth/*", toNodeHandler(auth));


app.use(express.json());


app.get("/", (req, res) => {
  res.send("🚀 SmartResell Server is Running...");
});


app.get("/api/test", (req, res) => {
  res.json({ success: true, message: "API working correctly" });
});

async function startServer() {
  try {
    await client.connect();
    console.log(" MongoDB Connected");

    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    app.post("/api/products", async (req, res) => {
      try {
        const product = req.body;
        const result = await productsCollection.insertOne(product);
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    app.get("/api/products", async (req, res) => {
      try {
        const { search, category, sort, page = 1, limit = 6 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};

        if (search) query.title = { $regex: search, $options: "i" };
        if (category && category !== "All") query.category = category;

        let sortOptions = {};
        if (sort === "lowToHigh") sortOptions.price = 1;
        if (sort === "highToLow") sortOptions.price = -1;

        const products = await productsCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .toArray();

        const totalProducts = await productsCollection.countDocuments(query);

        res.status(200).json({
          success: true,
          products,
          totalPages: Math.ceil(totalProducts / Number(limit)),
          currentPage: Number(page),
        });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    app.post("/api/orders", async (req, res) => {
      try {
        const result = await ordersCollection.insertOne(req.body);
        res.status(201).json({ success: true, insertedId: result.insertedId });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    });

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    }
  } catch (error) {
    console.error("Server Error:", error);
  }
}

startServer();

export default app;