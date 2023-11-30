const backendUrl = 'http://localhost:8081';

export async function getUser(username) {
    const response = await fetch(`${backendUrl}/user/${username}`);
    const user = await response.json();
    return user;
}

export async function getPinsOfUser(username) {
    const response = await fetch(`${backendUrl}/pin/${username}`);
    const pins = await response.json();
    return pins;
}

export async function getAllPins() {
    const response = await fetch(`${backendUrl}/pin`);
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
    const createdPin = await response.json();
    return createdPin;
}

// user: {
// name
// age
// homeLocation
// }

/**
 * @param {{name: string, age: number, homeLocation: string}} user
 */
export async function createUser(user) {
    const response = await fetch(`${backendUrl}/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
    });
    const createdUser = await response.json();
    return createdUser;
}

