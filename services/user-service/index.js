import express from "express";
import mongoose from "mongoose";

// use .env file in parent directory (only needed for local development)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

// connect to MongoDB
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));
await mongoose.connect(MONDODB_URI);

// start express server
const app = express();
const port = 3001;

// define routes
app.get("/", (req, res) => {
    res.json({ message: "Hello from user-service" });
});

app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));