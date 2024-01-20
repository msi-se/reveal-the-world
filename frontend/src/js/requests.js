import { TENANT, BACKEND_URL } from "./config";

export async function getPins() {
    try {
        const response = await fetch(`${BACKEND_URL}/pin/`, {
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

/**
 * @param {{longitude: number, latitude: number, name: string, description: string, date: string, companions: string, duration: string, budget: string}} pin
 */
export async function createPin(pin) {
    try {
        console.log(JSON.stringify(pin));
        const response = await fetch(`${BACKEND_URL}/pin/`, {
            method: "POST",
            body: JSON.stringify(pin),
            headers: {
                "Content-Type": "application/json",
                "tenant": TENANT
            }
        });

        console.log(response);
    
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
        const response = await fetch(`${BACKEND_URL}/heatmap/`, {
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