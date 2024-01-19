import express from "express";
import { MongoClient } from "mongodb";
import cookieParser from 'cookie-parser';
import auth from "./auth-middleware.js";

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
const pinCollection = database.collection("pin");
const polygonCollection = database.collection("polygon");
// heatRegionsState = { timestamp: string, heatRegions: [{ polygonname: string, density: number (0-1), count: number }] }
const heatRegionStateCollection = database.collection("heatRegionState");
const analyticsStateCollection = database.collection("analytics");


// start express server
const app = express();
const port = 3005;
app.use(express.json());
app.use(cookieParser());
// app.use(auth);

// define routes
app.get("/", (req, res) => {
    res.status(200).send("Update service is running");
});

app.post("/", async (req, res) => {

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

    /* analytics */

    // calculate bestVisitedRegionInTheLastMonth, amountOfPinsTotal, amountOfPinsLastMonth // TODO: later more analytics properties
    let bestVisitedRegionInTheLastMonth = "";
    let amountOfPinsTotal = 0;
    let amountOfPinsLastMonth = 0;

    let lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    let startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
    let endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
    let bestVisitedRegionInTheLastMonthCount = 0;

    // calculate the analytics
    let aggregatedPinsLastMonth = [];
    for (let i = 0; i < pins.length; i++) {
        const pin = pins[i];
        amountOfPinsTotal++;
        let pinDate = new Date(pin.date);
        if (pinDate > startOfLastMonth && pinDate < endOfLastMonth) {
            amountOfPinsLastMonth++;
        }
        if (pin.polygonname) {
            if (pinDate > startOfLastMonth && pinDate < endOfLastMonth) {
                const index = aggregatedPinsLastMonth.findIndex((aggregatedPin) => aggregatedPin.polygonname === pin.polygonname);
                if (index === -1) {
                    aggregatedPinsLastMonth.push({ polygonname: pin.polygonname, count: 1 });
                } else {
                    aggregatedPinsLastMonth[index].count++;
                }
            }
        }
    };
    aggregatedPinsLastMonth.forEach((aggregatedPin) => {
        if (aggregatedPin.count > bestVisitedRegionInTheLastMonthCount) {
            bestVisitedRegionInTheLastMonthCount = aggregatedPin.count;
            bestVisitedRegionInTheLastMonth = aggregatedPin.polygonname;
        }
    });

    // save the analytics
    const analyticsState = {
        timestamp: new Date().toISOString(),
        bestVisitedRegionInTheLastMonth: bestVisitedRegionInTheLastMonth,
        amountOfPinsTotal: amountOfPinsTotal,
        amountOfPinsLastMonth: amountOfPinsLastMonth,
    };
    await analyticsStateCollection.insertOne(analyticsState);

});

// start the server
app.listen(port, () => {
    console.log(`Update service listening at http://localhost:${port}`);
});