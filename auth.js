import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const { client } = require("./index.js"); 
const db = client.db("smartresell");

export const auth = betterAuth({
    database: mongodbAdapter(db),
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
    },
    
    session: {
        cookieCache: {
            enabled: true,
            strategy: "jwt"
        }
    }
});