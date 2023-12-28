const backendUrl = 'http://localhost/api';

/**
 * @param {string} username
 * @param {string} token
 */
export async function getPinsOfUser(username, token) {
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
 */
export async function createPin(pin) {
    console.log(JSON.stringify(pin));
    const response = await fetch(`${backendUrl}/pin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(pin)
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}, ${response.statusText}`);
    const createdPin = await response.json();
    return createdPin;
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