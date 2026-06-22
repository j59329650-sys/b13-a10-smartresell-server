const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://b13-a10-smartresell-client.vercel.app",
    ],
    credentials: true,
  })
);
app.use(express.json());


const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
   
    await client.connect();
    console.log("MongoDB Native Driver Connected Successfully!");

    
    const db = client.db("SmartResellDB");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("products");

   
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

    app.put("/users/:email", async (req, res) => {
      try {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true }; 

        const updateDoc = {
          $set: {
            name: user.name,
            email: user.email,
            photo: user.photo || "",
            role: user.role || "buyer",
          },
        };

        const result = await usersCollection.updateOne(filter, updateDoc, options);

        
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "1d",
        });

        res.send({ success: true, result, token });
      } catch (error) {
        res.status(500).send({ success: false, message: error.message });
      }
    });

    

    
    app.post("/api/products", async (req, res) => {
      try {
        const newProduct = req.body;
        newProduct.createdAt = new Date(); 
        const result = await productsCollection.insertOne(newProduct);
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ২. সব প্রোডাক্ট ডাটাবেজ থেকে আনা (GET)
    app.get("/api/products", async (req, res) => {
      try {
        const products = await productsCollection
          .find()
          .sort({ createdAt: -1 }) // নতুন প্রোডাক্ট আগে দেখাবে
          .toArray();

        res.status(200).json({ success: true, data: products });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

  } catch (error) {
    console.error("❌ Database Connection Error:", error);
  }
}
run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("SmartResell Server is Running...");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});