// API abstraction layer for Planta
// Currently backed by mock data. When AWS is ready, swap implementations here.

import {
  getDefaultPlants,
  getPlantSensorData,
  refreshPlantSensorData,
  generateLatestReading,
  PLANT_TYPES,
  plantStore,
} from './mockData';

// Simulate network delay
function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200));
}

// --- Sensor Data ---

export async function fetchSensorData(plantId, hours = 24) {
  await delay(200);
  return getPlantSensorData(plantId, hours);
}

export async function fetchLatestReading(plantId) {
  await delay(100);
  const data = getPlantSensorData(plantId, 24);
  return data[data.length - 1];
}

export async function refreshSensorData(plantId) {
  await delay(150);
  refreshPlantSensorData(plantId);
  return getPlantSensorData(plantId, 24);
}

// --- Plants ---

export async function fetchPlants() {
  await delay(250);
  return [...getDefaultPlants()];
}

export async function fetchPlant(plantId) {
  await delay(150);
  const plants = getDefaultPlants();
  const plant = plants.find(p => p.id === plantId);
  if (!plant) throw new Error('Plant not found');
  return { ...plant };
}

export async function createPlant({ name, type, deviceId }) {
  await delay(300);
  const plants = getDefaultPlants();
  const newPlant = {
    id: `plant-${Date.now()}`,
    name,
    type,
    deviceId: deviceId || `device-${Date.now()}`,
    createdAt: Date.now(),
    status: 'healthy',
  };
  plants.push(newPlant);
  return { ...newPlant };
}

export async function deletePlant(plantId) {
  await delay(200);
  const plants = getDefaultPlants();
  const index = plants.findIndex(p => p.id === plantId);
  if (index === -1) throw new Error('Plant not found');
  plants.splice(index, 1);
  return { success: true };
}

export async function updatePlant(plantId, updates) {
  await delay(200);
  const plants = getDefaultPlants();
  const plant = plants.find(p => p.id === plantId);
  if (!plant) throw new Error('Plant not found');
  Object.assign(plant, updates);
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
