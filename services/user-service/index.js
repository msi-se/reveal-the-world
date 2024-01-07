import express from "express";
import { MongoClient } from "mongodb";
import pkceChallenge from 'pkce-challenge';
import jwt from "jsonwebtoken";
import auth from "./auth-middleware.js";
import cookieParser from 'cookie-parser';

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
app.use(cookieParser());
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

    // get token from request body or header
    let { token } = req.body;
    if (!token) {
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader) {
            const tokenParts = authorizationHeader.split(" ");
            if (tokenParts.length === 2 && tokenParts[0] === "Bearer") {
                token = tokenParts[1];
            }
        }
    }
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

app.get("/test", auth, async (req, res) => {
    res.json(res.user);
});

// const clientId = 'e9fdb985-9173-4e01-9d73-ac2d60d1dc8e';
// const fusionAuthURL = 'http://localhost:9011';

// const userSession = 'userSession';

// app.get('/login', async (req, res, next) => {
//     const stateValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//     const pkcePair = await pkceChallenge();
//     res.cookie(userSession, { stateValue, verifier: pkcePair.code_verifier, challenge: pkcePair.code_challenge }, { httpOnly: true });

//     res.redirect(302, `${fusionAuthURL}/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=http://localhost:${port}/oauth-redirect&state=${stateValue}&code_challenge=${pkcePair}&code_challenge_method=S256`)
// });

// app.get('/oauth-redirect', async (req, res, next) => {
//     // Capture query params
//     const stateFromFusionAuth = `${req.query?.state}`;
//     const authCode = `${req.query?.code}`;

//     // Validate cookie state matches FusionAuth's returned state
//     const userSessionCookie = req.cookies[userSession];
//     if (stateFromFusionAuth !== userSessionCookie?.stateValue) {
//         console.log("State doesn't match. uh-oh.");
//         console.log("Saw: " + stateFromFusionAuth + ", but expected: " + userSessionCookie?.stateValue);
//         res.redirect(302, '/');
//         return;
//     }

//     try {
//         // Exchange Auth Code and Verifier for Access Token
//         const accessToken = (await client.exchangeOAuthCodeForAccessTokenUsingPKCE(authCode,
//             clientId,
//             clientSecret,
//             `http://localhost:${port}/oauth-redirect`,
//             userSessionCookie.verifier)).response;

//         if (!accessToken.access_token) {
//             console.error('Failed to get Access Token')
//             return;
//         }
//         res.cookie(userToken, accessToken, { httpOnly: true })

//         // Exchange Access Token for User
//         const userResponse = (await client.retrieveUserUsingJWT(accessToken.access_token)).response;
//         if (!userResponse?.user) {
//             console.error('Failed to get User from access token, redirecting home.');
//             res.redirect(302, '/');
//         }
//         res.cookie(userDetails, userResponse.user);

//         res.redirect(302, '/');
//     } catch (err) {
//         console.error(err);
//         res.status(err?.statusCode || 500).json(JSON.stringify({
//             error: err
//         }))
//     }
// });

app.listen(port, () => console.log(`Example app listening on http://localhost:${port}`));