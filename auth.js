import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dotenv from "dotenv";
import { db } from "./db.js"; 

dotenv.config();

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