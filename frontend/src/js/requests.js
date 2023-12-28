const backendUrl = 'http://localhost/api';

/**
 * @param {string} username
 * @param {string} token
 */
export async function getPinsOfUser(username, token) {
    try {
        const response = await fetch(`${backendUrl}/pin/${username}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
        const pins = await response.json();
        return pins;
    
    } catch (error) {
        console.log(error);
        return [];
    }
}

// pin: {
// userId
// longitude
// latitude
// name
// description
// date
// companions
// duration
// budget
// }

/**
 * @param {{username: string, longitude: number, latitude: number, name: string, description: string, date: string, companions: string, duration: string, budget: string}} pin
 * @param {string} token
 */
export async function createPin(pin, token) {
    try {
        console.log(JSON.stringify(pin));
        const response = await fetch(`${backendUrl}/pin/`, {
            method: "POST",
            body: JSON.stringify(pin),
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });
    
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
        const createdPin = await response.json();
        return createdPin;
    } catch (error) {
        console.log(error);
        return null;
    }
}

/**
 * Login user
 * @param {{username: string, password: string}} user
 * @returns {Promise<string | null>} token
 */
export async function login(user) {
    try {
        const response = await fetch(`${backendUrl}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });
    
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
        const body = await response.json();
        return body.token;
    } catch (error) {
        console.log(error);
        return null;
    }

}

/**
 * Verify user token
 * @param {string} token
 * @returns {Promise<string | null>} username
 * @throws {Error} if token is invalid
 */
export async function verifyToken(token) {
    try {
        const response = await fetch(`${backendUrl}/user/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: token })
        });
    
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
        const body = await response.json();
        return body.username;
    } catch (error) {
        console.log(error);
        return null;
    }
}

/**
 * get heatmap data
 * @returns {Promise<{ timestamp: string, heatRegions: [{ polygonname: string, density: number, count: number, polygon: number[][] }] } | null>}
 */
export async function getHeatmapData() {
    try {
        const response = await fetch(`${backendUrl}/heatmap`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
        const body = await response.json();
        return body;
    } catch (error) {
        console.log(error);
        return null;
    }
}