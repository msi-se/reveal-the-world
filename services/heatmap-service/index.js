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

// create a view that joins the heatRegion and polygon collections
await database.command({ drop: "heatRegionStateWithPolygonView" });
// polygon: {polygonname: string, polygon: []}
// heatRegionWithPolygonView: { timestamp: string, heatRegions: [{ polygonname: string, density: number (0-1), count: number, polygon: [] }] }
await database.command({
    create: "heatRegionStateWithPolygonView",
    viewOn: "heatRegionState",
    pipeline: [
        {
            $lookup: {
                from: "polygon",
                localField: "heatRegions.polygonname",
                foreignField: "polygonname",
                as: "polygondata",
            },
        },
        {
            $project: {
                _id: 0,
                timestamp: 1,
                heatRegions: {
                    polygonname: 1,
                    density: 1,
                    count: 1,
                    polygon: "$polygondata.polygon",
                },
            },
        },
        {
            $unwind: {
                path: "$heatRegions",
                preserveNullAndEmptyArrays: true,
            },
        },
    ],
});

// start express server
const app = express();
const port = 3003;
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

    // get the current heat region state
    const heatRegionState = await heatRegionStateCollection.find({}).sort({ timestamp: -1 }).limit(1).next();
    if (!heatRegionState) {
        res.status(400).send("No heat region state found");
        return;
    }

    // send the heat region state
    res.status(200).send(heatRegionState);
});

// start the server
app.listen(port, () => {
    console.log(`Heatmap service listening at http://localhost:${port}`);
});