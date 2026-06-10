import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSensorData, fetchLatestReading } from '../services/api';

/**
 * Hook for fetching and auto-refreshing sensor data for a plant.
 * @param {string} plantId
 * @param {number} hours - Time range in hours
 * @param {number} refreshInterval - Auto-refresh interval in ms (0 = disabled)
 */
export function useSensorData(plantId, hours = 24, refreshInterval = 30000) {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    if (!plantId) return;
    try {
      setError(null);
      const sensorData = await fetchSensorData(plantId, hours);
      setData(sensorData);
      if (sensorData.length > 0) {
        setLatest(sensorData[sensorData.length - 1]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [plantId, hours]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (refreshInterval > 0 && plantId) {
      intervalRef.current = setInterval(() => {
        load();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [load, refreshInterval, plantId]);

  const refresh = useCallback(() => {
    return load();
  }, [load]);

  // Computed stats
  const stats = computeStats(data);

  return { data, latest, loading, error, refresh, stats };
}

function computeStats(data) {
  if (!data || data.length === 0) {
    return {
      temperature: { min: 0, max: 0, avg: 0 },
      airHumidity: { min: 0, max: 0, avg: 0 },
      soilHumidity: { min: 0, max: 0, avg: 0 },
      wateringCount: 0,
    };
  }

  const temps = data.map(d => d.temperature);
  const airH = data.map(d => d.airHumidity);
  const soilH = data.map(d => d.soilHumidity);

  return {
    temperature: {
      min: Math.round(Math.min(...temps) * 10) / 10,
      max: Math.round(Math.max(...temps) * 10) / 10,
      avg: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
    },
    airHumidity: {
      min: Math.round(Math.min(...airH) * 10) / 10,
      max: Math.round(Math.max(...airH) * 10) / 10,
      avg: Math.round((airH.reduce((a, b) => a + b, 0) / airH.length) * 10) / 10,
    },
    soilHumidity: {
      min: Math.round(Math.min(...soilH) * 10) / 10,
      max: Math.round(Math.max(...soilH) * 10) / 10,
      avg: Math.round((soilH.reduce((a, b) => a + b, 0) / soilH.length) * 10) / 10,
    },
    wateringCount: data.filter(d => d.relay === 1).length,
  };
}
