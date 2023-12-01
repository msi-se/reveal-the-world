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
    const userCollection = database.collection("users");
    const pinCollection = database.collection("pins");

    // print out the current users and pins
    const users = await userCollection.find({}).toArray();
    console.log(users);
    const pins = await pinCollection.find({}).toArray();
    console.log(pins);

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
        const pins = await pinCollection.find({ username: req.params.username }).toArray();
        res.send(pins);
    });

    // pin: {username: string, longitude: number, latitude: number, name: string, description: string, date: string, companions: string, duration: string, budget: string}
    app.post("/pin", async (req, res) => {
        const pin = req.body;

        // fetch the polygon outline from nominatim
        const polygon = await getOutlineForLatLng(pin.latitude, pin.longitude);
        pin.polygon = polygon;

        await pinCollection.insertOne(pin);
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


/**
* Get a place from nominatim by coordinates
* @param {{lat: number, lng: number}} coords
* @param {number} zoom
* @returns {Promise<any>}
*/
const getPlaceByCoords = async (coords, zoom = 20) => {
    console.log(`getPlaceByCoords: ${coords.lat}, ${coords.lng}`);
    let data = await fetch(
        // eslint-disable-next-line max-len
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=${5}`,
    );
    data = await data.json();
    if (data === undefined) return;
    const place = getPlaceByNominatimData(data, coords);
    console.log(place);
    if (place?.realCoords?.lat === undefined || place?.realCoords?.lng === undefined) {
        place.realCoords = coords;
    }
    return place;
};

/**
 * Converts the coordinates of a GeoJSON polygon to the format used by Leaflet
 * @param {number[]} coords The coordinates of the GeoJSON polygon
 * @returns {number[][]} The coordinates of the Leaflet polygon
 */
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

const getOutlineForLatLng = async (lat, lng) => {
    const placeName = (await getPlaceByCoords({ lat: lat, lng: lng }, 10))?.name;
    console.log(`getOutlineForLatLng: ${placeName}`);
    let data = await fetch(
        // eslint-disable-next-line max-len
        `https://nominatim.openstreetmap.org/search?q=${placeName}&format=json&limit=1&polygon_geojson=1&polygon_threshold=0.0005`,
    );
    data = await data.json();
    // check if the response is suited for a polygon outline
    if (
        data[0]?.geojson?.coordinates === undefined ||
        data[0]?.geojson?.type === undefined ||
        data[0]?.boundingbox === undefined ||
        (data[0]?.geojson?.type !== "Polygon" && data[0]?.geojson?.type !== "MultiPolygon") ||
        (data[0]?.class !== "boundary" && data[0]?.class !== "place" && data[0]?.class !== "landuse")
    ) {
        return [];
    }


    const latLngs = convertGeoJsonCoordsToLeafletLatLng(data[0].geojson.coordinates);
    return latLngs;
};


/**
 * Get a place from nominatim response data
 * @param {any} placeData
 * @param {{ lat: number, lng: number}  | undefined } userInputCoords
 * @returns {any}
 */
const getPlaceByNominatimData = (placeData, userInputCoords) => {
    if (placeData === undefined) return;

    const convertLongOsmTypeTo1Letter = osmType => {
        switch (osmType) {
            case "node":
                return "N";
            case "way":
                return "W";
            case "relation":
                return "R";
            default:
                return "";
        }
    };

    let place = {
        name: placeData?.display_name || "Unknown location",
        address: {
            amenity: placeData?.address?.amenity || "",
            city: placeData?.address?.city || "",
            cityDistrict: placeData?.address?.city_district || "",
            municipality: placeData?.address?.municipality || "",
            country: placeData?.address?.country || "",
            countryCode: placeData?.address?.country_code || "",
            neighbourhood: placeData?.address?.neighbourhood || "",
            postcode: placeData?.address?.postcode || "",
            road: placeData?.address?.road || "",
            houseNumber: placeData?.address?.house_number || "",
            state: placeData?.address?.state || "",
            suburb: placeData?.address?.suburb || "",
        },
        type: placeData?.type || "",
        importance: placeData?.importance ? parseFloat(placeData?.lat) : 0,
        osmId:
            placeData?.osm_type && placeData?.osm_id
                ? `${convertLongOsmTypeTo1Letter(placeData?.osm_type)}${placeData?.osm_id}`
                : "",
        realCoords: {
            lat: placeData?.lat ? parseFloat(placeData?.lat) : undefined,
            lng: placeData?.lon ? parseFloat(placeData?.lon) : undefined,
        },
        userInputCoords: {
            lat: userInputCoords?.lat ? userInputCoords.lat : placeData?.lat ? parseFloat(placeData?.lat) : undefined,
            lng: userInputCoords?.lng ? userInputCoords.lng : placeData?.lon ? parseFloat(placeData?.lon) : undefined,
        },
        zoomLevel: getZoomByBoundingBox(placeData?.boundingbox) || 10,
        wikidata: placeData?.extratags?.wikidata || "",
        wikipedia: placeData?.extratags?.wikipedia || "",
        searchedByCoords: false,
        searchedByCurrentLocation: false,
        searchedByPlace: false,
        searchedByAddress: false,
    };
    return place;
};

/**
 * Get the zoom level by a given bounding box
 * @param {number[] | string[] | undefined} boundingbox
 * @returns {number | undefined}
 * @see https://wiki.openstreetmap.org/wiki/Zoom_levels
 * @see https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Zoom_levels
 */
const getZoomByBoundingBox = boundingbox => {
    if (boundingbox === undefined) return undefined;

    const lat1 = parseFloat(`${boundingbox[0]}`);
    const lat2 = parseFloat(`${boundingbox[1]}`);
    const lng1 = parseFloat(`${boundingbox[2]}`);
    const lng2 = parseFloat(`${boundingbox[3]}`);
    const latDiff = Math.abs(lat1 - lat2);
    const lngDiff = Math.abs(lng1 - lng2);
    const maxDiff = Math.max(latDiff, lngDiff);
    const zoom = Math.min(Math.round(Math.log(360 / maxDiff) / Math.log(2)), 18);
    return zoom;
};

main().catch(console.error);