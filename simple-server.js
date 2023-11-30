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
        const existingUser = await userCollection.findOne({name: user.name});
        if (existingUser) {
            res.send(existingUser);
            return;
        }

        // otherwise, create a new user
        await userCollection.insertOne(user);

        res.send(user);
    });

    app.get("/user/:name", async (req, res) => {
        const user = await userCollection.findOne({name: req.params.name});
        res.send(user);
    });

    app.get("/pin/:username", async (req, res) => {
        const pins = await pinCollection.find({username: req.params.username}).toArray();
        res.send(pins);
    });

    app.post("/pin", async (req, res) => {
        const pin = req.body;
        await pinCollection.insertOne(pin);
        res.send(pin);
    });

    app.get("/pin", async (req, res) => {
        const pins = await pinCollection.find({}).toArray();
        res.send(pins);
    });

    app.get("/pin/:id", async (req, res) => {
        const pin = await pinCollection.findOne({id: req.params.id});
        res.send(pin);
    });

    app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));
}

main().catch(console.error);