import express from "express";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

// use .env file in parent directory (only needed for local development)
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const JWT_SECRET = process.env.JWT_SECRET || "TEST_SECRET";

// connect to MongoDB
const client = new MongoClient(MONDODB_URI);
await client.connect();
const database = client.db("reveal-the-world");

// setup collections
const userCollection = database.collection("user");

// start express server
const app = express();
const port = 3001;
app.use(express.json());

// define routes
app.get("/", (req, res) => {
    res.status(200).send("User service is running");
});

app.post("/login", async (req, res) => {

    // get username and password from request body
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).send("Username or password missing");
        return;
    }

    // check if user exists
    const existingUser = await userCollection.findOne({ username: username });
    if (!existingUser) {
        // create new user
        const newUser = { username: username, password: password };
        await userCollection.insertOne(newUser);
    } else {
        // check if password is correct
        if (existingUser.password !== password) {
            res.status(400).send("Wrong password");
            return;
        }
    }

    // create token (valid for 1 week) (later done by fusionauth?)
    const token = jwt.sign({ username: username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token: token });
});

app.post("/verify", async (req, res) => {
    
    // get token from request body
    const { token } = req.body;
    if (!token) {
        res.status(400).send("Token missing");
        return;
    }

    // verify token
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded !== "object" || !decoded.username) {
            res.status(400).send("Invalid token");
            return;
        }
        res.json({ username: decoded.username });
    } catch (err) {
        res.status(400).send("Invalid token");
    }
});

app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));