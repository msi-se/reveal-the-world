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
const pinCollection = database.collection("pin");
const polygonCollection = database.collection("polygon");
// heatRegionsState = { timestamp: string, heatRegions: [{ polygonname: string, density: number (0-1), count: number }] }
const heatRegionStateCollection = database.collection("heatRegion");

// start express server
const app = express();
const port = 3005;
app.use(express.json());

// define routes
app.get("/", (req, res) => {
    res.status(200).send("Update service is running");
});

app.post("/", async (req, res) => {

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

    // send response and continue with the update (async)
    res.status(200).send("Update started");

    // get all pins
    const pins = await pinCollection.find({}).toArray();

    // aggregate the pins by polygon
    const heatRegions = [];
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        const polygonname = pin.polygonname;
        const polygon = await polygonCollection.findOne({ polygonname: polygonname });
        if (polygon) {
            const index = heatRegions.findIndex((heatRegion) => heatRegion.polygonname === polygonname);
            if (index === -1) {
                heatRegions.push({ polygonname: polygonname, density: 1, count: 1 });
            } else {
                heatRegions[index].count++;
            }
        }
    };

    // calculate the density for each region
    const maxDensity = heatRegions.reduce((max, heatRegion) => Math.max(max, heatRegion.count), 0);
    heatRegions.forEach((heatRegion) => {
        heatRegion.density = heatRegion.count / maxDensity;
    });

    // save the heat regions
    const heatRegionState = {
        timestamp: new Date().toISOString(),
        heatRegions: heatRegions,
    };
    await heatRegionStateCollection.insertOne(heatRegionState);

});

// start the server
app.listen(port, () => {
    console.log(`Update service listening at http://localhost:${port}`);
});