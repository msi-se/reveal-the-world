const uuid = require('uuid');
const { FusionAuthClient } = require('@fusionauth/node-client');

const appUrl = 'http://localhost';
const client = new FusionAuthClient('33052c8a-c283-4e96-9d2a-eb1215c69f8f-not-for-prod', 'http://localhost:9011');

async function deleteTenant(tenantName) {
    try {
        let response = await client.searchTenants({
            "search": {
                "name": tenantName,
            }
        });
        let tenants = response.successResponse.tenants;
        if (tenants.length > 0 && tenants[0].name === tenantName) {
            let tenantId = tenants[0].id;
            await client.deleteTenant(tenantId);
        }
    } catch (e) {
        console.log(e);
    }
}

async function create(tenantName) {
    await deleteTenant(tenantName);
    try {
        let tenantId = uuid.v4();
        await client.createTenant(tenantId, {
            "tenant": {
                "name": tenantName,
            }
        });
        client.tenantId = tenantId;

        let applicationId = uuid.v4();
        let clientSecret = uuid.v4().replace(/-/g, '');
        await client.createApplication(applicationId, {
            "application": {
                "name": `${tenantName}-app`,
                "tenantId": tenantId,
                "oauthConfiguration": {
                    "authorizedRedirectURLs": [
                        appUrl + "/auth/oauth-redirect"
                    ],
                    "logoutURL": appUrl + "/auth/oauth2/logout?tenant=" + tenantName,
                    "clientSecret": clientSecret,
                    "enabledGrants": [
                        "authorization_code",
                        "refresh_token"
                    ],
                    "generateRefreshTokens": true,
                    "requireRegistration": true
                },
                "jwtConfiguration": {
                    "enabled": true
                },
                "registrationConfiguration": {
                    "enabled": true,
                    "type": "basic",
                    "confirmPassword": true,
                    "loginIdType": "username"
                },
            }
        });
        return {tenantId, applicationId, clientSecret};
    } catch (e) {
        console.log(e);
    }
}

async function main() {
    const tenantName = "adac";
    const {tenantId, applicationId, clientSecret} = await create(tenantName);
    console.log(`Created tenant ${tenantName}`);
    console.log(`- Tenant ID: ${tenantId}`);
    console.log(`- Application ID: ${applicationId}`);
    console.log(`- Client Secret: ${clientSecret}`);
}

main();
