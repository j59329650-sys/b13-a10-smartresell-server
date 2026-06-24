import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { client, db } from "./db.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Better Auth
app.all("/api/auth/*", toNodeHandler(auth));

// Root Route
app.get("/", (req, res) => {
  res.send("SmartResell Server is Running...");
});

async function startServer() {
  try {
    await client.connect();
    console.log("MongoDB Connected");

    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    // Add Product
    app.post("/api/products", async (req, res) => {
      try {
        const result = await productsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    });

    // Get Products
    app.get("/api/products", async (req, res) => {
      try {
        const {
          search,
          category,
          sort,
          page = 1,
          limit = 6,
        } = req.query;

        const skip = (Number(page) - 1) * Number(limit);

        let query = {};

        if (search) {
          query.title = {
            $regex: search,
            $options: "i",
          };
        }

        if (category) {
          query.category = category;
        }

        let sortOptions = {};

        if (sort === "lowToHigh") sortOptions.price = 1;
        if (sort === "highToLow") sortOptions.price = -1;

        const products = await productsCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .toArray();

        const totalProducts =
          await productsCollection.countDocuments(query);

        res.json({
          products,
          totalPages: Math.ceil(
            totalProducts / Number(limit)
          ),
          currentPage: Number(page),
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          message: error.message,
        });
      }
    });

    // Create Order
    app.post("/api/orders", async (req, res) => {
      try {
        const result = await ordersCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).json({
          message: error.message,
        });
      }
    });

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
  }
}

startServer();

export default app;