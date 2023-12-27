// this jest script is used to test the actual service endpoints
// therefor it is not really a unit test but more of an integration test
// more info:
//  - it uses the actual database
//  - it uses jest as a test runner
//  - it is a module (so import not require)
//  - it doese not include the services as code but tests directly the endpoints (via localhost)

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



});