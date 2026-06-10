import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const PlantContext = createContext(null);

export function PlantProvider({ children }) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.fetchPlants();
      setPlants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlants();
  }, [loadPlants]);

  const addPlant = useCallback(async (plantData) => {
    const newPlant = await api.createPlant(plantData);
    setPlants(prev => [...prev, newPlant]);
    return newPlant;
  }, []);

  const removePlant = useCallback(async (plantId) => {
    await api.deletePlant(plantId);
    setPlants(prev => prev.filter(p => p.id !== plantId));
  }, []);

  const editPlant = useCallback(async (plantId, updates) => {
    const updated = await api.updatePlant(plantId, updates);
    setPlants(prev => prev.map(p => p.id === plantId ? updated : p));
    return updated;
  }, []);

  const value = {
    plants,
    loading,
    error,
    addPlant,
    removePlant,
    editPlant,
    refreshPlants: loadPlants,
  };

  return (
    <PlantContext.Provider value={value}>
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants() {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants must be used within a PlantProvider');
  }
  return context;
}

export default PlantContext;
