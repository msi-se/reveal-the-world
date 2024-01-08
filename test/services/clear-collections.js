import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
    
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../services/.env") });
const MONDODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";    

// connect to MongoDB
const client = new MongoClient(MONDODB_URI);
client.connect();
const database = client.db("reveal-the-world");
console.log("Connected to MongoDB");

// setup collections
const userCollection = database.collection("user");
const pinCollection = database.collection("pin");
const polygonCollection = database.collection("polygon");
const heatRegionCollection = database.collection("heatRegion");

// clear all collections
await userCollection.deleteMany({});
await pinCollection.deleteMany({});
await polygonCollection.deleteMany({});
await heatRegionCollection.deleteMany({});

// exit
console.log("Cleared all collections");
client.close();