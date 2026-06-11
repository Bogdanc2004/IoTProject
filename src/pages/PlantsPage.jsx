import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlants } from '../context/PlantContext';
import { fetchLatestReading } from '../services/api';
import PlantCard from '../components/plants/PlantCard';
import AddPlantModal from '../components/plants/AddPlantModal';

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export default function PlantsPage() {
  const { plants, loading, addPlant } = usePlants();
  const [showModal, setShowModal] = useState(false);
  const [readings, setReadings] = useState({});
  const navigate = useNavigate();

  // Fetch latest readings for each plant
  useEffect(() => {
    async function loadReadings() {
      const results = {};
      for (const plant of plants) {
        try {
          const reading = await fetchLatestReading(plant.id);
          results[plant.id] = reading;
        } catch {
          // Skip failed readings
        }
      }
      setReadings(results);
    }

    if (plants.length > 0) {
      loadReadings();
    }
  }, [plants]);

  return (
    <div>
      <div className="plants-header">
        <h1>
          My Plants
          <span className="plants-count">{plants.length} plant{plants.length !== 1 ? 's' : ''}</span>
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <div className="spinner spinner--lg" />
        </div>
      ) : plants.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </svg>
          <h3>No plants yet</h3>
          <p>Add your first plant to start monitoring its health and environment.</p>
          <button
            className="btn-primary"
            onClick={() => setShowModal(true)}
            style={{ marginTop: 'var(--space-lg)' }}
            id="add-first-plant-btn"
          >
            <PlusIcon /> Add Your First Plant
          </button>
        </div>
      ) : (
        <div className="plants-grid">
          {plants.map((plant, index) => (
            <div
              key={plant.id}
              className={`animate-fade-in stagger-${Math.min(index + 1, 5)}`}
            >
              <PlantCard
                plant={plant}
                latestReading={readings[plant.id]}
                onClick={() => navigate(`/plants/${plant.id}`)}
              />
            </div>
          ))}

          {/* Add plant tile */}
          <div className="animate-fade-in" style={{ animationDelay: `${(plants.length + 1) * 0.05}s`, opacity: 0 }}>
            <div
              className="add-plant-card"
              onClick={() => setShowModal(true)}
              id="add-plant-tile"
            >
              <PlusIcon />
              <span>Add New Plant</span>
            </div>
          </div>
        </div>
      )}

      <AddPlantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addPlant}
      />
    </div>
  );
}
