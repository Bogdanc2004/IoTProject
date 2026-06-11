import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePlants } from '../context/PlantContext';
import { useSensorData } from '../hooks/useSensorData';
import SensorCard from '../components/dashboard/SensorCard';
import SensorChart from '../components/dashboard/SensorChart';
import WateringIndicator from '../components/dashboard/WateringIndicator';
import AiOverview from '../components/dashboard/AiOverview';

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { plants } = usePlants();
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Select first plant by default
  useEffect(() => {
    if (plants.length > 0 && !selectedPlantId) {
      setSelectedPlantId(plants[0].id);
    }
    // Reset selection if all plants are removed
    if (plants.length === 0) {
      setSelectedPlantId(null);
    }
  }, [plants, selectedPlantId]);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const { data, latest, loading, stats } = useSensorData(selectedPlantId, 24, 30000);

  const selectedPlant = plants.find(p => p.id === selectedPlantId);

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-row">
          <div>
            <h1>Dashboard</h1>
            <p>
              {selectedPlant
                ? `Monitoring ${selectedPlant.name}`
                : 'Overview of your plant sensors'}
            </p>
          </div>
          <div className="dashboard-time">
            <span className="live-dot" />
            <span>Live</span>
            <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>|</span>
            <span>{formatDate()}</span>
          </div>
        </div>

        {/* Plant selector (if multiple plants) */}
        {plants.length > 1 && (
          <div style={{ marginTop: 'var(--space-md)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {plants.map(plant => (
              <button
                key={plant.id}
                className={`chart-tab ${selectedPlantId === plant.id ? 'chart-tab--active' : ''}`}
                onClick={() => setSelectedPlantId(plant.id)}
                id={`plant-selector-${plant.id}`}
              >
                {plant.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {plants.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </svg>
          <h3>No plants added yet</h3>
          <p>Add a plant and connect it to your IoT sensor to start monitoring live data.</p>
          <Link to="/plants" className="btn-primary" style={{ marginTop: 'var(--space-lg)', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            Go to My Plants
          </Link>
        </div>
      ) : loading && !latest ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="spinner spinner--lg" />
          <p style={{ color: 'var(--text-muted)', marginTop: 16 }}>Loading sensor data...</p>
        </div>
      ) : (
        <>
          {/* AI Overview */}
          <AiOverview 
            plant={selectedPlant} 
            stats={stats} 
            latest={latest} 
            loading={loading} 
          />

          {/* Sensor Cards */}
          <div className="sensor-grid">
            <SensorCard
              type="temperature"
              value={latest?.temperature}
              stats={stats?.temperature}
            />
            <SensorCard
              type="airHumidity"
              value={latest?.airHumidity}
              stats={stats?.airHumidity}
            />
            <SensorCard
              type="soilHumidity"
              value={latest?.soilHumidity}
              stats={stats?.soilHumidity}
            />
          </div>

          {/* Chart */}
          <SensorChart data={data} />

          {/* Watering Status */}
          <WateringIndicator data={data} />
        </>
      )}
    </div>
  );
}
