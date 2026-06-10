// Mock data generator for Planta
// Replicates the mathematical model from synthetic_data_generator.py
// to produce realistic sensor readings in the browser.

const READINGS_PER_DAY = 24;

function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

/**
 * Generate a batch of sensor readings.
 * @param {number} count - Number of data points to generate
 * @param {number} startHour - Starting hour offset (0 = now)
 * @returns {Array<Object>} Array of sensor data points
 */
export function generateSensorData(count = 24, startHour = 0) {
  const now = Date.now();
  const hourMs = 3600000;
  const data = [];
  let soilLevel = 75 + Math.random() * 10;

  for (let i = 0; i < count; i++) {
    const t = startHour + i;
    const timestamp = now - (count - i) * hourMs;

    // Temperature: sinusoidal daily cycle around 20C with +/-10C swing
    const temperature = Math.sin((2 * Math.PI * t) / READINGS_PER_DAY) * 10 + 20 + gaussianRandom(0, 1);

    // Air humidity: inversely correlated with temperature
    const airHumidity = Math.max(15, Math.min(100,
      70 - 2.5 * (temperature - 15) + gaussianRandom(0, 5)
    ));

    // Soil humidity: gradual decay with occasional watering
    const rateOfDrying = 0.5 + 0.05 * (temperature - 15) + 0.02 * (airHumidity - 50);
    soilLevel -= rateOfDrying;
    const soilHumidity = soilLevel + gaussianRandom(0, 2);

    // Watering threshold (from the model logic)
    const wateringThreshold = 30 + 0.5 * (temperature - 15) - 0.1 * (airHumidity - 50);
    let relay = 0;

    if (soilHumidity < wateringThreshold) {
      relay = 1;
      soilLevel = 85.0;
    }

    data.push({
      timestamp,
      temperature: Math.round(temperature * 100) / 100,
      airHumidity: Math.round(airHumidity * 100) / 100,
      soilHumidity: Math.round(Math.max(0, Math.min(100, soilHumidity)) * 100) / 100,
      relay,
    });
  }

  return data;
}

/**
 * Generate a single "latest" reading with realistic current values.
 */
export function generateLatestReading() {
  const hour = new Date().getHours();
  const data = generateSensorData(1, hour);
  return data[0];
}

// Pre-generated plant data store (persisted in memory during session)
const plantStore = {
  plants: null,
  sensorCache: new Map(),
};

const PLANT_TYPES = [
  'Monstera Deliciosa',
  'Fiddle Leaf Fig',
  'Snake Plant',
  'Pothos',
  'Peace Lily',
  'Spider Plant',
  'Aloe Vera',
  'Carnation (Garoafă)',
  'Orchid',
  'Rose',
  'Tulip'
];

const DEFAULT_PLANTS = [
  {
    id: 'plant-1',
    name: 'Living Room Monstera',
    type: 'Monstera Deliciosa',
    deviceId: 'device-001',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    status: 'healthy',
  },
  {
    id: 'plant-2',
    name: 'Bedroom Snake Plant',
    type: 'Snake Plant',
    deviceId: 'device-002',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    status: 'healthy',
  },
  {
    id: 'plant-3',
    name: 'Balcony Carnation',
    type: 'Carnation (Garoafă)',
    deviceId: 'device-003',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    status: 'healthy',
  },
  {
    id: 'plant-4',
    name: 'Window Orchid',
    type: 'Orchid',
    deviceId: 'device-004',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    status: 'critical',
  },
  {
    id: 'plant-5',
    name: 'Garden Rose',
    type: 'Rose',
    deviceId: 'device-005',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    status: 'warning',
  },
  {
    id: 'plant-6',
    name: 'Spring Tulip',
    type: 'Tulip',
    deviceId: 'device-006',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    status: 'healthy',
  },
];

function getDefaultPlants() {
  if (plantStore.plants) return plantStore.plants;
  
  plantStore.plants = [...DEFAULT_PLANTS];

  return plantStore.plants;
}

/**
 * Get sensor data for a specific plant.
 * Generates and caches data so the same plant shows consistent readings.
 */
export function getPlantSensorData(plantId, hours = 24) {
  const cacheKey = `${plantId}-${hours}`;

  if (!plantStore.sensorCache.has(cacheKey)) {
    // Use plant index as seed offset to get different but consistent patterns
    const plants = getDefaultPlants();
    const idx = plants.findIndex(p => p.id === plantId);
    const offset = (idx >= 0 ? idx : 0) * 8;
    const data = generateSensorData(hours, offset);
    
    // Sabotage data for the Window Orchid so it's clearly unhealthy
    if (plantId === 'plant-4') {
      data.forEach(d => {
        d.soilHumidity = Math.max(0, d.soilHumidity - 60); // Severely dry
        d.temperature = d.temperature + 15; // Dangerously hot
        d.airHumidity = Math.max(10, d.airHumidity - 40); // Too dry
      });
    }

    plantStore.sensorCache.set(cacheKey, data);
  }

  return plantStore.sensorCache.get(cacheKey);
}

/**
 * Refresh sensor data for a plant (simulates new live reading).
 */
export function refreshPlantSensorData(plantId) {
  // Clear cache so new data is generated
  for (const key of plantStore.sensorCache.keys()) {
    if (key.startsWith(plantId)) {
      plantStore.sensorCache.delete(key);
    }
  }
}

export { getDefaultPlants, PLANT_TYPES, plantStore };
