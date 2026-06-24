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

// Better Auth Routes
app.all("/api/auth/*", toNodeHandler(auth));

// Root Route
app.get("/", (req, res) => {
  res.send(" SmartResell Server is Running...");
});

// Test Route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API working",
  });
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

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
          acknowledged: result.acknowledged,
          message: "Product added successfully",
        });
      } catch (error) {
        console.error("Add Product Error:", error);

        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    
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

        const query = {};

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

        if (sort === "lowToHigh") {
          sortOptions.price = 1;
        }

        if (sort === "highToLow") {
          sortOptions.price = -1;
        }

        const products = await productsCollection
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .toArray();

        const totalProducts =
          await productsCollection.countDocuments(query);

        res.status(200).json({
          success: true,
          products,
          totalPages: Math.ceil(
            totalProducts / Number(limit)
          ),
          currentPage: Number(page),
        });
      } catch (error) {
        console.error("Get Products Error:", error);

        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    
    app.post("/api/orders", async (req, res) => {
      try {
        const order = req.body;

        const result = await ordersCollection.insertOne(order);

        res.status(201).json({
          success: true,
          insertedId: result.insertedId,
          message: "Order created successfully",
        });
      } catch (error) {
        console.error("Order Error:", error);

        res.status(500).json({
          success: false,
          message: error.message,
        });
      }
    });

    if (process.env.NODE_ENV !== "production") {
      app.listen(PORT, () => {
        console.log(` Server running on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error(" Server Error:", error);
  }
}

startServer();

export default app;