const uuid = require('uuid');
const { FusionAuthClient } = require('@fusionauth/node-client');
const prompt = require('prompt-sync')();
const fs = require('fs');
require('dotenv').config()


const appUrl = process.env.APP_URL || 'http://localhost';
const FA_URL = process.env.FA_URL || 'http://localhost:9011';
const FA_API_KEY = process.env.FA_API_KEY || '33052c8a-c283-4e96-9d2a-eb1215c69f8f-not-for-prod';
const client = new FusionAuthClient(FA_API_KEY, FA_URL);
const clientSecret = process.env.CLIENT_SECRET || "super-secret-secret-that-should-be-regenerated-for-production";

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
        return { tenantId, applicationId };
    } catch (e) {
        console.log(e);
    }
}

function createK8sFrontendYaml(tenant, applicationId, port, logo, backgroundColor) {
    let frontendYaml = fs.readFileSync('./frontend-template.yaml', 'utf8');
    const replacements = { "%tenant%": tenant, "%applicationId%": applicationId, "%port%": port, "%logo%": logo, "%backgroundColor%": backgroundColor };
    let frontendTenantYaml = frontendYaml.replace(/%\w+%/g, function(all) {
        return replacements[all] || all;
    });
    // TODO: deployement typo
    fs.writeFileSync(`../deployement/k8s/frontend-${tenant}.yaml`, frontendTenantYaml);
}

function appendTenantToIngress(tenant, port) {
    let ingressYaml = fs.readFileSync('../deployement/k8s/ingress.yaml', 'utf8');
    let ingresTemplateYaml = fs.readFileSync('./ingres-template.yaml', 'utf8');
    const replacements = { "%tenant%": tenant, "%port%": port };
    let ingresAppendTenantYaml = ingresTemplateYaml.replace(/%\w+%/g, function(all) {
        return replacements[all] || all;
    });
    fs.writeFileSync('../deployement/k8s/ingress.yaml', ingressYaml + "\n" + ingresAppendTenantYaml);
}

async function main() {
    const tenant = prompt("Tenant: ");
    const port = prompt("Port: ");
    const logo = prompt("Logo-Path: ") || "default-logo.png";
    const backgroundColor = "#" + prompt("Background-Color: #") || "FFFFFF";
    if (!tenant || !port || !backgroundColor) {
        console.log("Tenant, port and background-color are required");
        return;
    }
    const { tenantId, applicationId } = await create(tenant);
    console.log(`Created tenant ${tenant}`);
    console.log(`- Tenant ID: ${tenantId}`);
    console.log(`- Application ID: ${applicationId}`);
    console.log();
    createK8sFrontendYaml(tenant, applicationId, port, logo, backgroundColor);
    appendTenantToIngress(tenant, port);
}

main();
