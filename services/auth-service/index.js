import { FusionAuthClient } from "@fusionauth/node-client";
import express from 'express';
import cookieParser from 'cookie-parser';
import pkceChallenge from 'pkce-challenge';
import verify from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import * as path from 'path';

// Add environment variables
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
const port = 8080; // default port to listen

// if (!process.env.clientId) {
//   console.error('Missing clientId from .env');
//   process.exit();
// }
// if (!process.env.clientSecret) {
//   console.error('Missing clientSecret from .env');
//   process.exit();
// }
if (!process.env.fusionAuthURL) {
  console.error('Missing fusionAuthURL from .env');
  process.exit();
}
if (!process.env.internalFusionAuthURL) {
  console.error('Missing internalFusionAuthURL from .env');
  process.exit();
}
// const clientId = process.env.clientId;
// const clientSecret = process.env.clientSecret;
const fusionAuthURL = process.env.fusionAuthURL;
const internalFusionAuthURL = process.env.internalFusionAuthURL;

// Validate the token signature, make sure it wasn't expired
const validateUser = async (userTokenCookie) => {
  // Make sure the user is authenticated.
  if (!userTokenCookie || !userTokenCookie?.access_token) {
    return false;
  }
  try {
    let decodedFromJwt;
    await verify(userTokenCookie.access_token, await getKey, undefined, (err, decoded) => {
      decodedFromJwt = decoded;
    });
    return decodedFromJwt;
  } catch (err) {
    console.error(err);
    return false;
  }
}


const getKey = async (header, callback) => {
  const jwks = jwksClient({
    jwksUri: `${internalFusionAuthURL}/.well-known/jwks.json`
  });
  const key = await jwks.getSigningKey(header.kid);
  var signingKey = key?.getPublicKey() || key?.rsaPublicKey;
  callback(null, signingKey);
}

const tenantToPath = (tenant) => {
  return tenant === 'default' ? '/' : `/${tenant}`;
}

//Cookies
const userSession = 'userSession';
const userToken = 'userToken';
const userDetails = 'userDetails'; //Non Http-Only with user info (not trusted)

const client = new FusionAuthClient('noapikeyneeded', internalFusionAuthURL);

app.use(cookieParser());
/** Decode Form URL Encoded data */
app.use(express.urlencoded());

app.get('/login', async (req, res, next) => {
  const tenant = `${req.query?.tenant}`;
  const clientId = `${req.query?.clientId}`;
  
  const stateValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const pkcePair = await pkceChallenge();
  res.cookie(userSession, { stateValue, verifier: pkcePair.code_verifier, challenge: pkcePair.code_challenge, tenant: tenant, clientId: clientId }, { httpOnly: true });

  res.redirect(302, `${fusionAuthURL}/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=http://localhost/auth/oauth-redirect&state=${stateValue}&code_challenge=${pkcePair.code_challenge}&code_challenge_method=S256`)
});

app.get('/oauth-redirect', async (req, res, next) => {
  // Capture query params
  const stateFromFusionAuth = `${req.query?.state}`;
  const authCode = `${req.query?.code}`;
  
  const userSessionCookie = req.cookies[userSession];
  res.clearCookie(userSession);
  if (!userSessionCookie.clientId || !userSessionCookie.tenant) {
    console.log('Missing clientId or tenant from cookie');
    res.redirect(302, '/');
    return;
  }
  
  const clientId = userSessionCookie.clientId;
  const tenant = userSessionCookie.tenant;
  
  // Validate cookie state matches FusionAuth's returned state
  if (stateFromFusionAuth !== userSessionCookie?.stateValue) {
    console.log("State doesn't match. uh-oh.");
    console.log("Saw: " + stateFromFusionAuth + ", but expected: " + userSessionCookie?.stateValue);
    res.redirect(302, tenantToPath(tenant));
    return;
  }

  const clientSecret = process.env[`${tenant}_clientSecret`];
  if (!clientSecret) {
    console.error(`Missing ${tenant}_clientSecret from .env`);
    res.redirect(302, tenantToPath(tenant));
    return;
  }
  
  try {
    console.log(authCode, clientId, clientSecret, userSessionCookie.verifier);
    // Exchange Auth Code and Verifier for Access Token
    let response = await client.exchangeOAuthCodeForAccessTokenUsingPKCE(authCode,
      clientId,
      clientSecret,
      `http://localhost/auth/oauth-redirect`,
      userSessionCookie.verifier);
    
    if (response.statusCode !== 200) {
      console.error('Failed to get Access Token')
      return;
    }
    const accessToken = response.successResponse;

    if (!accessToken.access_token) {
      console.error('Failed to get Access Token')
      return;
    }
    res.cookie(`${tenant}-${userToken}`, accessToken, { httpOnly: true })

    // Exchange Access Token for User
    response = await client.retrieveUserUsingJWT(accessToken.access_token);
    
    if (response.statusCode !== 200) {
      console.error('Failed to get User from access token, redirecting home.');
      res.redirect(302, tenantToPath(tenant));
    }
    const userResponse = response.successResponse;

    if (!userResponse?.user) {
      console.error('Failed to get User from access token, redirecting home.');
      res.redirect(302, tenantToPath(tenant));
    }
    res.cookie(`${tenant}-${userDetails}`, userResponse.user);

    res.redirect(302, tenantToPath(tenant));
  } catch (err) {
    console.error(err);
    res.status(err?.statusCode || 500).json(JSON.stringify({
      error: err
    }))
  }
});

app.get('/logout', (req, res, next) => {
  const clientId = `${req.query?.clientId}`;

  res.redirect(302, `${fusionAuthURL}/oauth2/logout?client_id=${clientId}`);
});

app.get('/oauth2/logout', (req, res, next) => {
  const tenant = `${req.query?.tenant}`;
  if (!tenant) {
    console.error('Missing tenant from query params');
    res.redirect(302, '/');
    return;
  }

  console.log('Logging out...')
  res.clearCookie(`${tenant}-${userToken}`);
  res.clearCookie(`${tenant}-${userDetails}`);

  res.redirect(302, tenantToPath(tenant));
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
