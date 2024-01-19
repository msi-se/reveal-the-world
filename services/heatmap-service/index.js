import express from "express";
import { MongoClient } from "mongodb";
import cookieParser from 'cookie-parser';
import auth from "./auth-middleware.js";

// use .env file in parent directory (only needed for local development)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const debug = (...args) => { console.log(...args); };

const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";

debug("heatmap-service: connecting to MongoDB: ", MONDODB_URI);

// connect to MongoDB
const client = new MongoClient(MONDODB_URI);
await client.connect();
const database = client.db("reveal-the-world");

// setup collections
const pinCollection = database.collection("pin");
const polygonCollection = database.collection("polygon");
// heatRegionsState = { timestamp: string, heatRegions: [{ polygonname: string, density: number (0-1), count: number }] }
const heatRegionStateCollection = database.collection("heatRegionState");

// start express server
const app = express();
const port = 3003;
app.use(express.json());
app.use(cookieParser());
// app.use(auth);


// define routes
app.get("/", async (req, res) => {

    debug("heatmap-service: GET /");

    // get the current heat region state
    const heatRegionState = await heatRegionStateCollection.find({}).sort({ "timestamp": -1 }).limit(1).next();
    if (!heatRegionState) {
        debug("heatmap-service: no heat region state found");
        res.status(400).send("No heat region state found");
        return;
    }

    debug("heatmap-service: heat region state: ", heatRegionState);

    const polygonNames = heatRegionState.heatRegions.map(heatRegion => heatRegion.polygonname);

    debug("heatmap-service: polygon names: ", polygonNames);

    const polygons = await polygonCollection.find({ polygonname: { $in: polygonNames } }).toArray();

    debug("heatmap-service: polygons: ", polygons);

    heatRegionState.heatRegions.forEach(heatRegion => {
        const polygon = polygons.find(polygon => polygon.polygonname === heatRegion.polygonname);
        if (!polygon) {
            console.error(`Could not find polygon ${heatRegion.polygonname}`);
            return;
        }
        heatRegion.polygon = polygon.polygon;
    });

    debug("heatmap-service: sending heat region state: ", heatRegionState);

    // send the heat region state
    res.status(200).send(heatRegionState);
});

// start the server
app.listen(port, () => {
    console.log(`Heatmap service listening at http://localhost:${port}`);
});