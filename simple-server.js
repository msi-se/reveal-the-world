// imports
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

// setup express server
const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 8081;

// setup mongo client
const client = new MongoClient("mongodb://localhost:27017");

async function main() {

    // connect to mongo and read the database
    await client.connect();
    const database = client.db("reveal-the-world");
    const userCollection = database.collection("user");
    const pinCollection = database.collection("pin");
    const polygonCollection = database.collection("polygon");

    // create a view that joins the pin and polygon collections (but first drop the view if it already exists)
    await database.command({ drop: "pinWithPolygonView" });
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
                    polygon: "$polygondata.polygon"
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

    // print out the current users and pins
    const users = await userCollection.find({}).toArray();
    console.log("users", users);
    const pins = await pinCollection.find({}).toArray();
    console.log("pins", pins);
    const polygons = await polygonCollection.find({}).toArray();
    console.log("polygons", polygons);
    const pinsWithPolygon = await pinWithPolygonView.find({}).toArray();
    console.log("pinsWithPolygon", pinsWithPolygon);

    // await userCollection.deleteMany({});
    // await pinCollection.deleteMany({});
    // await polygonCollection.deleteMany({});

    // configure different endpoints
    app.get("/user", async (req, res) => {
        const users = await userCollection.find({}).toArray();
        res.send(users);
    });

    app.post("/user", async (req, res) => {
        const user = req.body;

        // if user already exists, return the existing user (by name)
        const existingUser = await userCollection.findOne({ name: user.name });
        if (existingUser) {
            res.send(existingUser);
            return;
        }

        // otherwise, create a new user
        await userCollection.insertOne(user);

        res.send(user);
    });

    app.get("/user/:name", async (req, res) => {
        const user = await userCollection.findOne({ name: req.params.name });
        res.send(user);
    });

    app.get("/pin/:username", async (req, res) => {
        const pins = await pinWithPolygonView.find({ username: req.params.username }).toArray();
        res.send(pins);
    });

    // pin: {username: string, longitude: number, latitude: number, name: string, description: string, date: string, companions: string, duration: string, budget: string}
    app.post("/pin", async (req, res) => {
        const pin = req.body;

        // fetch the polygon outline from nominatim
        const { polygon, polygonname } = await getPolygonAndName(pin.latitude, pin.longitude);
        pin.polygonname = polygonname;
        await pinCollection.insertOne(pin);

        // save the polygon outline to the database to not have to fetch it again
        await polygonCollection.insertOne({ polygonname, polygon });
        pin.polygon = polygon;

        res.send(pin);
    });

    app.get("/pin", async (req, res) => {
        const pins = await pinCollection.find({}).toArray();
        res.send(pins);
    });

    app.get("/pin/:id", async (req, res) => {
        const pin = await pinCollection.findOne({ id: req.params.id });
        res.send(pin);
    });

    app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));
}



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

    for (let tryIndex = 0; tryIndex < 10; tryIndex++) {

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
}

main().catch(console.error);