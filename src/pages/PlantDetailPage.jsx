import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchPlant } from '../services/api';
import { useSensorData } from '../hooks/useSensorData';
import { usePlants } from '../context/PlantContext';
import SensorCard from '../components/dashboard/SensorCard';
import SensorChart from '../components/dashboard/SensorChart';
import WateringIndicator from '../components/dashboard/WateringIndicator';
import AiOverview from '../components/dashboard/AiOverview';

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12,19 5,12 12,5" />
    </svg>
  );
}

function PlantSvgIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 20h10" />
      <path d="M10 20c5.5-2.5.8-6.4 3-10" />
      <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
      <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export default function PlantDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState(null);
  const [plantLoading, setPlantLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { removePlant } = usePlants();

  const { data, latest, loading: sensorLoading, stats } = useSensorData(id, 24, 30000);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetchPlant(id);
        setPlant(p);
      } catch {
        navigate('/plants');
      } finally {
        setPlantLoading(false);
      }
    }
    load();
  }, [id, navigate]);

  function handleDeleteClick() {
    setShowDeleteModal(true);
  }

  async function handleDeleteConfirm() {
    try {
      setDeleting(true);
      await removePlant(id);
      navigate('/plants');
    } catch (err) {
      alert('Failed to delete plant: ' + err.message);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (plantLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <div className="spinner spinner--lg" />
      </div>
    );
  }

  if (!plant) return null;

  const createdDate = new Date(plant.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div>
      <Link to="/plants" className="back-link">
        <ArrowLeftIcon />
        Back to Plants
      </Link>

      <div className="plant-detail-header">
        <div className="plant-detail-info">
          <div className="plant-detail-icon" style={{ overflow: 'hidden' }}>
            <img 
              src={`/plants/${plant.type}.png`} 
              alt={plant.type}
              style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
            />
          </div>
          <div>
            <h1 className="plant-detail-name">{plant.name}</h1>
            <div className="plant-detail-meta">
              <span>{plant.type}</span>
              <span>|</span>
              <span>Added {createdDate}</span>
              {plant.deviceId && (
                <>
                  <span>|</span>
                  <span>Device: {plant.deviceId}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="plant-detail-actions">
          <button
            className="btn-danger"
            onClick={handleDeleteClick}
            disabled={deleting}
            id="delete-plant-button"
          >
            <TrashIcon />
            <span style={{ marginLeft: 6 }}>Delete</span>
          </button>
        </div>
      </div>

      {sensorLoading && !latest ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <div className="spinner spinner--lg" />
        </div>
      ) : (
        <>
          <AiOverview 
            plant={plant} 
            stats={stats} 
            latest={latest} 
            loading={sensorLoading} 
          />
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

          <SensorChart data={data} />

          <WateringIndicator data={data} />
        </>
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--status-danger)' }}>Delete Plant</h2>
              <button className="icon-btn" onClick={() => !deleting && setShowDeleteModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body" style={{ padding: 'var(--space-xl) var(--space-xl) var(--space-md)' }}>
              <p>Are you sure you want to delete <strong>{plant.name}</strong>?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 'var(--space-md)' }}>
                This action cannot be undone. All sensor history and AI analysis data will be permanently removed.
              </p>
            </div>
            <div className="modal-footer" style={{ borderTop: 'none', padding: 'var(--space-md) var(--space-xl) var(--space-xl)', display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setShowDeleteModal(false)} 
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteConfirm} 
                disabled={deleting}
                style={{ width: '120px', justifyContent: 'center' }}
              >
                {deleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
