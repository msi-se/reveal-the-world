// this jest script is used to test the actual service endpoints
// therefor it is not really a unit test but more of an integration test
// more info:
//  - it uses the actual database
//  - it uses jest as a test runner
//  - it is a module (so import not require)
//  - it doese not include the services as code but tests directly the endpoints (via localhost)
//  - how to run: `node clear-collections.js; npx jest`

let token = "";

describe("user-service-test", () => {
    
    it("check if user service is running", async () => {
        const response = await fetch("http://localhost/api/user");
        expect(response.status).toEqual(200);
    });

    it("check if a user can register", async () => {
        const response = await fetch("http://localhost/api/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: "testuser",
                password: "testpassword"
            })
        });
        expect(response.status).toEqual(200);

        // get the token from the response and verify it
        const responseBody = await response.json();
        expect(responseBody.token).toBeDefined();
        expect(responseBody.token).not.toEqual("");

        // save the token for later use
        token = responseBody.token;

    });

    it("check if a user can login with the registered credentials", async () => {
        const response = await fetch("http://localhost/api/user/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: "testuser",
                password: "testpassword"
            })
        });
        expect(response.status).toEqual(200);

        // get the token from the response and verify it
        const responseBody = await response.json();
        expect(responseBody.token).toBeDefined();
        expect(responseBody.token).not.toEqual("");

        // save the token for later use
        token = responseBody.token;

    });

    it("check if the verification of a token works", async () => {
        const response = await fetch("http://localhost/api/user/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token
            })
        });
        expect(response.status).toEqual(200);

        // get the username from the response and verify it
        const responseBody = await response.json();
        expect(responseBody.username).toBeDefined();
        expect(responseBody.username).toEqual("testuser");

        // create a second token which is invalid
        const invalidToke = "invalidtoken";
        const invalidResponse = await fetch("http://localhost/api/user/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: invalidToke
            })
        });

        // check if the response is not ok
        expect(invalidResponse.ok).toBeFalsy();
        expect(invalidResponse.status).toEqual(400);
    });

    it("check if the verification of a token works with the token in the header", async () => {
        const response = await fetch("http://localhost/api/user/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(response.status).toEqual(200);

        // get the username from the response and verify it
        const responseBody = await response.json();
        expect(responseBody.username).toBeDefined();
        expect(responseBody.username).toEqual("testuser");
    });

});

describe("pin-service-test", () => {

    // pin: {username: string, longitude: number, latitude: number, name: string, description: string, date: string, companions: string, duration: string, budget: string}
    const pin = {
        username: "testuser",
        longitude: 47.98105173441768,
        latitude: 10.03543083869168,
        name: "Irgendwo in Ba-Wü",
        description: "testdescription",
        date: "testdate",
        companions: "testcompanions",
        duration: "testduration",
        budget: "testbudget"
    };

    it("check if pin service is running", async () => {
        const response = await fetch("http://localhost/api/pin");
        expect(response.status).toEqual(200);
    });

    it("check if a pin can be created", async () => {
        const response = await fetch("http://localhost/api/pin/", {
            method: "POST",
            body: JSON.stringify(pin),
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(response.status).toEqual(200);
        const responseBody = await response.json();
        for (const key in pin) {
            expect(responseBody[key]).toEqual(pin[key]);
        }

        // check if the polygon outline is included in the response
        expect(responseBody.polygon).toBeDefined();
    });

    it("check if the pins of a user can be retrieved", async () => {
        const response = await fetch("http://localhost/api/pin/testuser", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(response.status).toEqual(200);
        const responseBody = await response.json();
        expect(responseBody.length).toEqual(1);
        for (const key in pin) {
            expect(responseBody[0][key]).toEqual(pin[key]);
        }
    });

});
