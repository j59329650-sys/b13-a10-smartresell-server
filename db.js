import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

const client = new MongoClient(uri);

await client.connect();

console.log("✅ MongoDB Connected");

const db = client.db("smartresell");

export { client, db };