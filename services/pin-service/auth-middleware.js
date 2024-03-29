import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

if (!process.env.internalFusionAuthURL) {
    console.error('Missing internalFusionAuthURL from .env');
    process.exit();
}
const internalFusionAuthURL = process.env.internalFusionAuthURL;

const validateUser = async (userTokenCookie) => {
    // Make sure the user is authenticated.
    if (!userTokenCookie || !userTokenCookie?.access_token) {
        return false;
    }
    try {
        let decodedFromJwt;
        await jwt.verify(userTokenCookie.access_token, await getKey, undefined, (err, decoded) => {
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


const auth = async (req, res, next) => {
    const tenant = `${req.headers?.tenant}`;
    if (!tenant) {
        console.error('Missing tenant from query params');
        res.status(400).json(JSON.stringify({
            error: 'tenant missing'
        }))
        return;
    }

    const userTokenCookie = req.cookies[`${tenant}-userToken`];
    const user = await validateUser(userTokenCookie);
    if (!user) {
        res.status(403).json(JSON.stringify({
            error: 'Unauthorized'
        }))
        return;
    }
    req.user = {
        username: user.preferred_username,
        id: user.sub,
        tenant: tenant,
        tenantId: user.tid
    };
    next();
}

export default auth;