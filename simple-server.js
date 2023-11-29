// imports
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

// setup express server
const app = express();
app.use(cors());
const port = 8081;

// setup mongo client
const client = new MongoClient("mongodb://localhost:27017");

async function main() {

    // connect to mongo and read the database
    await client.connect();
    const database = client.db("reveal-the-world");
    const userCollection = database.collection("users");
    const pinCollection = database.collection("pins");
    
    // create a document to insert
    const users = await userCollection.find({}).toArray();
    console.log(users);

    // configure different endpoints
    app.get("/user", async (req, res) => {
        const users = await userCollection.find({}).toArray();
        res.send(users);
    });

    app.post("/user", async (req, res) => {
        const user = req.body;
        await userCollection.insertOne(user);
        res.send(user);
    });

    app.get("/user/:id", async (req, res) => {
        const user = await userCollection.findOne({id: req.params.id});
        res.send(user);
    });

    app.get("/pin/:user_id", async (req, res) => {
        const pins = await pinCollection.find({user_id: req.params.user_id}).toArray();
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