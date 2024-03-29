import express from "express";
import { MongoClient } from "mongodb";
import cookieParser from 'cookie-parser';

// use .env file in parent directory (only needed for local development)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

// connect to MongoDB
const client = new MongoClient(MONDODB_URI);
await client.connect();
const database = client.db("reveal-the-world");

// setup collections
const analyticsStateCollection = database.collection("analytics");
const telemetryCollection = database.collection("telemetry");

// start express server
const app = express();
const port = 3004;
app.use(express.json());
app.use(cookieParser());

// define routes
app.get("/:tenant", async (req, res) => {
    const tenant = req.params.tenant;

    // get the analytics state
    const analyticsState = await analyticsStateCollection.find({ tenant: tenant }).sort({ timestamp: -1 }).limit(1).next();
    if (!analyticsState) {
        res.status(400).send("No analytics state found");
        return;
    }

    // add a +1 to the telemetryCollection for the tenant
    await telemetryCollection.insertOne({
        tenant: tenant,
        timestamp: new Date(),
        type: "analytics",
        action: "get"
    });

    // send the analytics state
    res.status(200).send(analyticsState);
});

// start the server
app.listen(port, () => {
    console.log(`Analytics service listening at http://localhost:${port}`);
});