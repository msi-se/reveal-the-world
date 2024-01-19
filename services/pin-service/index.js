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
const userCollection = database.collection("user");
const pinCollection = database.collection("pin");
const polygonCollection = database.collection("polygon");
const heatRegionCollection = database.collection("heatRegion");

// create a view that joins the pin and polygon collections
try { await database.command({ drop: "pinWithPolygonView" }); } catch (e) { }
await database.command({
    create: "pinWithPolygonView",
    viewOn: "pin",
    pipeline: [
        {
            $lookup: {
                from: "polygon",
                localField: "polygonname",
                foreignField: "polygonname",
                as: "polygondata",
            },
        },
        {
            $project: {
                _id: 0,
                id: 1,
                username: 1,
                longitude: 1,
                latitude: 1,
                name: 1,
                description: 1,
                date: 1,
                companions: 1,
                duration: 1,
                budget: 1,
                polygon: "$polygondata.polygon",
                polygonname: 1,
            },
        },
        {
            $unwind: {
                path: "$polygon",
                preserveNullAndEmptyArrays: true,
            },
        },
    ],
});
const pinWithPolygonView = database.collection("pinWithPolygonView");

// start express server
const app = express();
const port = 3002;
app.use(express.json());
app.use(cookieParser());
app.use(auth);
const debug = (...args) => { console.log(...args); };

app.post("/", async (req, res) => {
    let pin = req.body;

    debug("pin-service: received pin: ", pin);

    pin.username = req.user.username;

    debug("pin-service: username in request: ", req.user.username);

    const { polygon, polygonname } = await getPolygonAndName(pin.latitude, pin.longitude);
    if (!polygon) {
        res.status(400).send("Could not find polygon");
        return;
    }

    // save the polygon outline to the database to not have to fetch it again if it is not already there
    const existingPolygon = await polygonCollection.findOne({ polygonname });
    if (!existingPolygon) {
        await polygonCollection.insertOne({ polygonname, polygon });
    }
    pin.polygonname = polygonname;
    await pinCollection.insertOne(pin);

    // save the polygon outline to the database to not have to fetch it again
    pin.polygon = polygon;

    res.send(pin);
});

app.get("/", async (req, res) => {
    const user = req.user;

    debug("pin-service: username in get request: ", req.user.username);

    const pins = await pinWithPolygonView.find({ "username": req.user.username }).toArray();

    debug("pin-service: received pins from database: ", pins);

    res.send(pins);
});

app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));


// helper functions
/**
 * Fetches the polygon outline from nominatim.
 * @param {number} lat
 * @param {number} lng
 */
const getPolygonAndName = async (lat, lng) => {

    const convertGeoJsonCoordsToLeafletLatLng = coords => {
        if (coords === undefined) return [];

        const transformCoords = coords => {
            if (
                Array.isArray(coords) &&
                coords.length === 2 &&
                typeof coords[0] === "number" &&
                typeof coords[1] === "number"
            ) {
                return { lat: coords[1], lng: coords[0] };
            }
            return coords.map(transformCoords);
        };

        const latLngs = transformCoords(coords);

        return latLngs;
    };

    let polygon = null;
    let name = null;
    let zoom = 8;

    let wasTooBig = false;
    let wasTooSmall = false;

    let maxZoom = 10;
    let minZoom = 5;

    for (let tryIndex = 0; tryIndex < 5; tryIndex++) {

        // prepare the reverse geocoding request options
        let reverseRequestOptions = {
            lat: lat,
            lon: lng,
            format: "geojson",
            zoom: zoom,
            addressdetails: 1,
            extratags: 1,
            polygon_geojson: 1,
            polygon_threshold: 0.005,
        };

        // fetch the reverse geocoding response
        // @ts-ignore
        const url = `https://nominatim.openstreetmap.org/reverse?${new URLSearchParams(reverseRequestOptions)}`;
        const reverseResponse = await fetch(url);
        if (!reverseResponse.ok) throw new Error(`HTTP error! status: ${reverseResponse.status}`);
        const reverseResponseJson = await reverseResponse.json();

        // first check if there is a feature
        if (!reverseResponseJson.features || reverseResponseJson.features?.length === 0) {
            zoom--;
            continue;
        }

        let region = reverseResponseJson.features[0];

        // calculate the area and check if it is too big or too small
        let minArea = 3;
        let maxArea = 17;
        let bbox = region.bbox;
        let area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
        // console.log(`Area: ${area.toFixed(2)}`);
        if (area < minArea && !wasTooBig && zoom > minZoom) {
            // console.log(`Region is too small , zooming out to ${zoom - 1}`);
            zoom--;
            wasTooSmall = true;
            continue;
        } else if (area > maxArea && !wasTooSmall && zoom < maxZoom) {
            // console.log(`Region is too big, zooming in to ${zoom + 1}`);
            zoom++;
            wasTooBig = true;
            continue;
        }

        // if it has a polygon, use it
        if (region.geometry.type === "Polygon" || region.geometry.type === "MultiPolygon") {
            let polygonInGeoJSON = region.geometry.coordinates;
            name = region.properties.name;
            polygon = convertGeoJsonCoordsToLeafletLatLng(polygonInGeoJSON);
            // console.log("Region has a polygon: ", polygon);
            break;
        }
    }

    return { polygon, polygonname: name };
};