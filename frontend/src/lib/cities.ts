export type City = {
    id: string;
    name: string;
    lat: number;
    lon: number;
};

export const TECH_CITIES: City[] = [
    { id: "bengaluru", name: "Bengaluru", lat: 12.9716, lon: 77.5946 },
    { id: "hyderabad", name: "Hyderabad", lat: 17.385, lon: 78.4867 },
    { id: "pune", name: "Pune", lat: 18.5204, lon: 73.8567 },
    { id: "gurugram", name: "Gurugram", lat: 28.4595, lon: 77.0266 },
    { id: "delhi", name: "Delhi", lat: 28.6139, lon: 77.209 }
];
