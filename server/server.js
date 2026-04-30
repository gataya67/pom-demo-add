/* global process, console */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend is running",
  });
});

app.post("/api/cart", (req, res) => {
  const item = req.body?.item;

  if (!item) {
    return res.status(400).json({
      success: false,
      message: "Item is required",
    });
  }

  return res.status(200).json({
    success: true,
    item,
    message: `${item} added to cart`,
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});