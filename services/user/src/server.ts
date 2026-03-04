import express from "express";
import dotenv from "dotenv";
import connectDb from "./utils/db.js";
import userRoutes from "./routes/user.js";
import { v2 as cloudinary } from 'cloudinary';
import cors from "cors";
dotenv.config();

import { createClient } from "redis";

const statsRedis = createClient({ url: process.env.REDIS_URL });
statsRedis.connect().catch(console.error);




cloudinary.config({
  cloud_name: process.env.Cloud_Name,
  api_key: process.env.Cloud_Api_Key,
  api_secret: process.env.Cloud_Api_Secret,
});

const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});


connectDb();

app.use("/api/v1", userRoutes);

const port = process.env.PORT;

app.get("/api/v1/admin/stats", async (req, res) => {
  try {
    const keys = await statsRedis.keys("*:user-service:*");
    const stats = await Promise.all(
      keys.map(async (key) => ({
        key,
        value: await statsRedis.get(key),
      }))
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch stats" });
  }
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

