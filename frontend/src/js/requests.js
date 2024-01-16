import { TENANT } from "./tenant";

const backendUrl = 'http://localhost/api';

/**
 * @param {string} username
 */
export async function getPins() {
    try {
        const response = await fetch(`${backendUrl}/pin/`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "tenant": TENANT
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
export async function createPin(pin) {
    try {
        console.log(JSON.stringify(pin));
        const response = await fetch(`${backendUrl}/pin/`, {
            method: "POST",
            body: JSON.stringify(pin),
            headers: {
                "Content-Type": "application/json",
                "tenant": TENANT
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
 * get heatmap data
 * @returns {Promise<{ timestamp: string, heatRegions: [{ polygonname: string, density: number, count: number, polygon: number[][] }] } | null>}
 */
export async function getHeatmapData() {
    try {
        const response = await fetch(`${backendUrl}/heatmap`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                "tenant": TENANT
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