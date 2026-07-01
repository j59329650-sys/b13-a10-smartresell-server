import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { db } from "./db.js";
import { auth } from "./auth.js";
import { toNodeHandler } from "better-auth/node";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://b13-a10-smartresell-client.vercel.app",
    ],
    credentials: true,
  })
);

// Better Auth
app.all("/api/auth/*", toNodeHandler(auth));

// Collections
const productsCollection = db.collection("products");
const ordersCollection = db.collection("orders");

// Home
app.get("/", (req, res) => {
  res.send("SmartResell Server Running...");
});
app.get("/api/test", async (req, res) => {
  try {
    const users = await db.collection("user").find().toArray();

    res.json(users);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection.find().toArray();

    res.send(products);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.get("/api/products/:id", async (req, res) => {
  try {
    const id = req.params.id;

    const product = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    res.send(product);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.post("/api/products", async (req, res) => {
  try {
    const result = await productsCollection.insertOne(req.body);

    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});


app.post("/api/orders", async (req, res) => {
  try {
    const result = await ordersCollection.insertOne(req.body);

    res.send(result);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server Running on ${PORT}`);
});

export default app;