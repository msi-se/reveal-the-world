import express from "express";
import { MongoClient } from "mongodb";

// use .env file in parent directory (only needed for local development)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost";

// connect to MongoDB
const client = new MongoClient(MONDODB_URI);
await client.connect();
const database = client.db("reveal-the-world");

// setup collections
// analyticsState = { timestamp: string, bestVisitedRegionInTheLastMonth: string, amountOfPinsTotal: number, amountOfPinsLastMonth: number }
const analyticsStateCollection = database.collection("analytics");

// start express server
const app = express();
const port = 3004;
app.use(express.json());

// define routes
app.get("/", async (req, res) => {

    // verify token by using the user service
    const verifyResponse = await fetch(`${BACKEND_URL}/api/user/verify`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": req.headers.authorization || "",
        },
    });
    if (!verifyResponse.ok) {
        res.status(400).send("Invalid token");
        return;
    }

    // get the analytics state
    const analyticsState = await analyticsStateCollection.find({}).sort({ timestamp: -1 }).limit(1).next();
    if (!analyticsState) {
        res.status(400).send("No analytics state found");
        return;
    }

    // send the analytics state
    res.status(200).send(analyticsState);
});

// start the server
app.listen(port, () => {
    console.log(`Heatmap service listening at http://localhost:${port}`);
});