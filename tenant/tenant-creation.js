const uuid = require('uuid');
const { FusionAuthClient } = require('@fusionauth/node-client');
const prompt = require('prompt-sync')();
const fs = require('fs');

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

function createK8sFrontendYaml(tenant, applicationId, port, backgroundColor) {
    let frontendYaml = fs.readFileSync('./frontend-template.yaml', 'utf8');
    const replacements = { "%tenant%": tenant, "%applicationId%": applicationId, "%port%": port, "%backgroundColor%": backgroundColor };
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
    const tenant = prompt("Tenant name (key): ");
    const port = prompt("Port: ");
    const backgroundColor = "#" + prompt("Background-Color: #");
    const {tenantId, applicationId, clientSecret} = await create(tenant);
    console.log(`Created tenant ${tenant}`);
    console.log(`- Tenant ID: ${tenantId}`);
    console.log(`- Application ID: ${applicationId}`);
    console.log(`- Client Secret: ${clientSecret}`);
    console.log();
    createK8sFrontendYaml(tenant, applicationId, port, backgroundColor);
    appendTenantToIngress(tenant, port);
}

main();
