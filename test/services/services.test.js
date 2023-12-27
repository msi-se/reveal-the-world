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

    test("check if user service is running", async () => {
        const response = await fetch("http://localhost/api/user");
        expect(response.status).toEqual(200);
    });

    test("check if a user can register", async () => {
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

    test("check if a user can login with the registered credentials", async () => {
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

    test("check if the verification of a token works", async () => {
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

    test("check if the verification of a token works with the token in the header", async () => {
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
        longitude: 9.932852983474733,
        latitude: 47.52115319917437,
        name: "Irgendwo in Vorarlberg",
        description: "testdescription",
        date: "testdate",
        companions: "testcompanions",
        duration: "testduration",
        budget: "testbudget"
    };

    test("check if pin service is running", async () => {
        const response = await fetch("http://localhost/api/pin");
        expect(response.status).toEqual(200);
    });

    test("check if a pin can be created", async () => {
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

    test("check if the pins of a user can be retrieved", async () => {
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

describe("update-service-test", () => {

    test("check if update service is running", async () => {
        const response = await fetch("http://localhost/api/update");
        expect(response.status).toEqual(200);
    });

    test("check if the update service can be triggered", async () => {
        const response = await fetch("http://localhost/api/update/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(response.status).toEqual(200);
    });
});

describe("heatmap-service-test", () => {

    test("check if the heatmap can be retrieved", async () => {
        const response = await fetch("http://localhost/api/heatmap/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(response.status).toEqual(200);
        const responseBody = await response.json();
        expect(responseBody).toBeDefined();
        responseBody.heatRegions.forEach((heatRegion) => {
            expect(heatRegion.polygonname).toBeDefined();
            expect(heatRegion.density > 0 && heatRegion.density <= 1).toBeTruthy();
            expect(heatRegion.count > 0).toBeTruthy();
        });
    });

    test("check if the heatmap is correct", async () => {

        // add some pins
        const pins = [
            {
                username: "testuser",
                longitude: 9.932852983474733,
                latitude: 47.52115319917437,
                name: "Irgendwo in Vorarlberg",
                description: "testdescription",
                date: "testdate",
                companions: "testcompanions",
                duration: "testduration",
                budget: "testbudget"
            },
            {
                username: "testuser",
                longitude: 11.568603515625,
                latitude: 48.144097934938884,
                name: "Irgendwo in Bayern",
                description: "testdescription",
                date: "testdate",
                companions: "testcompanions",
                duration: "testduration",
                budget: "testbudget"
            },
            {
                username: "testuser",
                longitude: 11.568603515625,
                latitude: 48.144097934938884,
                name: "Irgendwo in Bayern",
                description: "testdescription",
                date: "testdate",
                companions: "testcompanions",
                duration: "testduration",
                budget: "testbudget"
            },
            {
                username: "testuser",
                longitude: 9.255981445312502,
                latitude: 47.9264654516972,
                name: "Irgendwo in Baden-Württemberg",
                description: "testdescription",
                date: "testdate",
                companions: "testcompanions",
                duration: "testduration",
                budget: "testbudget"
            },
            {
                username: "testuser",
                longitude: 13.386840820312502,
                latitude: 52.51622086393074,
                name: "Irgendwo in Berlin",
                description: "testdescription",
                date: "testdate",
                companions: "testcompanions",
                duration: "testduration",
                budget: "testbudget"
            }
        ];

        for (let i = 0; i < pins.length; i++) {
            const response = await fetch("http://localhost/api/pin/", {
                method: "POST",
                body: JSON.stringify(pins[i]),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });
            expect(response.status).toEqual(200);
        }

        // trigger the update service
        const updateResponse = await fetch("http://localhost/api/update/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        expect(updateResponse.status).toEqual(200);

        // wait for x seconds to make sure the update service has finished
        await new Promise((resolve) => setTimeout(resolve, 4000));

        // get the heatmap
        const heatmapResponse = await fetch("http://localhost/api/heatmap/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        // check if the response is good
        expect(heatmapResponse.status).toEqual(200);
        const responseBody = await heatmapResponse.json();
        expect(responseBody).toBeDefined();
        console.log(responseBody);

        // check if the densities are correct
        const voralberg = responseBody.heatRegions.find((heatRegion) => heatRegion.polygonname === "Vorarlberg");
        expect(voralberg.density).toEqual(1);
        expect(voralberg.count).toEqual(2);
        const bayern = responseBody.heatRegions.find((heatRegion) => heatRegion.polygonname === "Bayern");
        expect(bayern.density).toEqual(1);
        expect(bayern.count).toEqual(2);
        const badenWuerttemberg = responseBody.heatRegions.find((heatRegion) => heatRegion.polygonname === "Baden-Württemberg");
        expect(badenWuerttemberg.density).toEqual(0.5);
        expect(badenWuerttemberg.count).toEqual(1);
        const berlin = responseBody.heatRegions.find((heatRegion) => heatRegion.polygonname === "Berlin");
        expect(berlin.density).toEqual(0.5);
        expect(berlin.count).toEqual(1);
    }, 60000);


});