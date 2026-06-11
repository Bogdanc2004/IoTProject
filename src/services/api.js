// API abstraction layer for Planta
// Connected to AWS API Gateway for live sensor data.
// Plants are managed locally in localStorage; sensor data is fetched from the cloud
// and filtered by each plant's deviceId (matched against the Device field from AWS).

import { PLANT_TYPES } from './mockData';

const API_BASE = 'https://8in3gwsxq6.execute-api.eu-central-1.amazonaws.com';
const PLANTS_STORAGE_KEY = 'planta_plants';

// --- Plant store (persisted in localStorage) ---

function loadPlants() {
  try {
    const stored = localStorage.getItem(PLANTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePlants(plants) {
  localStorage.setItem(PLANTS_STORAGE_KEY, JSON.stringify(plants));
}

let plantStore = null;

function getPlants() {
  if (!plantStore) {
    plantStore = loadPlants();
  }
  return plantStore;
}

// --- Transform cloud data to internal format ---

function transformReading(raw) {
  return {
    timestamp: new Date(raw.Timestamp).getTime(),
    temperature: raw.Temperature ?? null,
    airHumidity: raw.Air_Humidity ?? null,
    soilHumidity: raw.Soil_Humidity ?? null,
    relay: raw.Relay === 'on' ? 1 : 0,
    device: raw.Device,
  };
}

// --- Sensor Data (from AWS) ---

let sensorCache = {
  data: null,
  fetchedAt: 0,
};

const CACHE_TTL = 10_000; // Cache for 10 seconds to avoid hammering the API

async function fetchFromCloud() {
  const now = Date.now();

  // Return cached data if still fresh
  if (sensorCache.data && now - sensorCache.fetchedAt < CACHE_TTL) {
    return sensorCache.data;
  }

  try {
    const response = await fetch(`${API_BASE}/data`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const rawData = await response.json();

    // Transform and sort by timestamp
    const allReadings = rawData
      .map(transformReading)
      .filter(d => d.timestamp && !isNaN(d.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Separate sensor readings from relay-only events
    const sensorReadings = allReadings.filter(d => d.temperature !== null);
    const relayEvents = allReadings.filter(d => d.temperature === null && d.relay === 1);

    // Merge relay events into the nearest sensor reading
    for (const relayEvt of relayEvents) {
      let closest = null;
      let closestDist = Infinity;
      for (const sr of sensorReadings) {
        const dist = Math.abs(sr.timestamp - relayEvt.timestamp);
        if (dist < closestDist) {
          closestDist = dist;
          closest = sr;
        }
      }
      if (closest) {
        closest.relay = 1;
      }
    }

    sensorCache.data = sensorReadings;
    sensorCache.fetchedAt = now;

    return sensorReadings;
  } catch (err) {
    console.error('[Planta API] Failed to fetch cloud data:', err);

    // Return cached data even if stale, as fallback
    if (sensorCache.data) {
      return sensorCache.data;
    }

    throw err;
  }
}

/**
 * Resolve a plant's deviceId from its plantId.
 */
function getDeviceId(plantId) {
  const plants = getPlants();
  const plant = plants.find(p => p.id === plantId);
  return plant?.deviceId || null;
}

export async function fetchSensorData(plantId, hours = 24) {
  const deviceId = getDeviceId(plantId);
  if (!deviceId) return [];

  const allData = await fetchFromCloud();

  // Filter by device and time range
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return allData.filter(d => d.device === deviceId && d.timestamp >= cutoff);
}

export async function fetchLatestReading(plantId) {
  const deviceId = getDeviceId(plantId);
  if (!deviceId) return null;

  const allData = await fetchFromCloud();

  // Filter to this device only
  const deviceData = allData.filter(d => d.device === deviceId);

  if (deviceData.length === 0) return null;

  // Find the latest reading that has sensor values (not just relay events)
  for (let i = deviceData.length - 1; i >= 0; i--) {
    if (deviceData[i].temperature !== null) {
      return deviceData[i];
    }
  }

  return deviceData[deviceData.length - 1];
}

export async function refreshSensorData(plantId) {
  // Invalidate cache to force a fresh fetch
  sensorCache.data = null;
  sensorCache.fetchedAt = 0;

  return fetchSensorData(plantId, 24);
}

// --- Plants (persisted in localStorage) ---

export async function fetchPlants() {
  return [...getPlants()];
}

export async function fetchPlant(plantId) {
  const plants = getPlants();
  const plant = plants.find(p => p.id === plantId);
  if (!plant) throw new Error('Plant not found');
  return { ...plant };
}

export async function createPlant({ name, type, deviceId }) {
  if (!deviceId || !deviceId.trim()) {
    throw new Error('Device ID is required to connect to a sensor');
  }

  const trimmedDeviceId = deviceId.trim();

  // Check if another plant already uses this device ID
  const plants = getPlants();
  const existing = plants.find(p => p.deviceId === trimmedDeviceId);
  if (existing) {
    throw new Error(`Device "${trimmedDeviceId}" is already used by "${existing.name}"`);
  }

  // Validate device ID against cloud data
  try {
    const cloudData = await fetchFromCloud();
    const hasDevice = cloudData.some(d => d.device === trimmedDeviceId);
    if (!hasDevice) {
      throw new Error(`No sensor found with Device ID "${trimmedDeviceId}". Check that your device is online and sending data.`);
    }
  } catch (err) {
    // If this is our own validation error, re-throw it
    if (err.message.includes('No sensor found')) {
      throw err;
    }
    // If the cloud API itself failed, warn but allow creation
    console.warn('[Planta] Could not validate device ID against cloud:', err.message);
  }

  const newPlant = {
    id: `plant-${Date.now()}`,
    name,
    type,
    deviceId: trimmedDeviceId,
    createdAt: Date.now(),
    status: 'healthy',
  };
  plants.push(newPlant);
  savePlants(plants);
  return { ...newPlant };
}

export async function deletePlant(plantId) {
  const plants = getPlants();
  const index = plants.findIndex(p => p.id === plantId);
  if (index === -1) throw new Error('Plant not found');
  plants.splice(index, 1);
  savePlants(plants);
  return { success: true };
}

export async function updatePlant(plantId, updates) {
  const plants = getPlants();
  const plant = plants.find(p => p.id === plantId);
  if (!plant) throw new Error('Plant not found');
  Object.assign(plant, updates);
  savePlants(plants);
  return { ...plant };
}

// --- Utilities ---

export function getPlantTypes() {
  return PLANT_TYPES;
}

export function getPlantStatus(sensorData) {
  if (!sensorData || sensorData.length === 0) return 'unknown';
  const latest = sensorData[sensorData.length - 1];

  if (latest.soilHumidity < 25 || latest.temperature > 38 || latest.temperature < 5) {
    return 'critical';
  }
  if (latest.soilHumidity < 35 || latest.temperature > 33 || latest.airHumidity < 25) {
    return 'attention';
  }
  return 'healthy';
}
