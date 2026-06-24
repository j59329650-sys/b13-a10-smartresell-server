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

const allowedOrigins = [
  "http://localhost:3000",
  "https://b13-a10-smartresell-client.vercel.app",
  "https://b13-a10-smartresell-client-c2iscl0ch-j59329650-sys-projects.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Better Auth Routes
app.all("/api/auth/*", toNodeHandler(auth));

// Root Route
app.get("/", (req, res) => {
  res.send("✅ SmartResell Server Running...");
});

async function startServer() {
  try {
    // MongoDB Connect
    await client.connect();
    console.log("✅ MongoDB Connected");

    const productsCollection = db.collection("products");
    const ordersCollection = db.collection("orders");

    // Add Product
    app.post("/products", async (req, res) => {
      try {
        const result = await productsCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Get Products
    app.get("/products", async (req, res) => {
      try {
        const {
          search,
          category,
          sort,
          page = 1,
          limit = 6,
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {
          status: "available",
        };

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
          .limit(parseInt(limit))
          .toArray();

        const totalProducts =
          await productsCollection.countDocuments(query);

        res.send({
          products,
          totalPages: Math.ceil(
            totalProducts / parseInt(limit)
          ),
          currentPage: parseInt(page),
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    // Create Order
    app.post("/orders", async (req, res) => {
      try {
        const result = await ordersCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        res.status(500).send({
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
    console.error("Server Error:", error);
  }
}

startServer();

export default app;