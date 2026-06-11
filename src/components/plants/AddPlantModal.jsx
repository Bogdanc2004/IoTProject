import { useState } from 'react';
import { getPlantTypes } from '../../services/api';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function AddPlantModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const plantTypes = getPlantTypes();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Plant name is required');
      return;
    }

    if (!type) {
      setError('Please select a plant type');
      return;
    }

    if (!deviceId.trim()) {
      setError('Device ID is required to connect to your sensor');
      return;
    }

    try {
      setLoading(true);
      await onAdd({ name: name.trim(), type, deviceId: deviceId.trim() || undefined });
      setName('');
      setType('');
      setDeviceId('');
      setIsDropdownOpen(false);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Plant</h2>
          <button className="modal-close" onClick={onClose} id="modal-close-btn">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="auth-form">
              {error && <div className="auth-error">{error}</div>}

              <div className="form-group">
                <label htmlFor="plant-name">Plant Name</label>
                <input
                  id="plant-name"
                  type="text"
                  placeholder="e.g., Living Room Monstera"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ position: 'relative' }}>
                <label>Plant Type</label>
                
                {isDropdownOpen && (
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 9 }} 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                )}
                
                <div 
                  className="custom-select-trigger" 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontFamily: 'var(--font-heading)',
                    minHeight: '48px'
                  }}
                >
                  {type ? (
                    <>
                      <img src={`/plants/${type}.png`} alt={type} style={{ width: '24px', height: '24px', objectFit: 'contain', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'} />
                      <span>{type}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Select a type...</span>
                  )}
                </div>
                
                {isDropdownOpen && (
                  <div 
                    className="custom-select-menu"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: 'var(--bg-card)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    {plantTypes.map(t => (
                      <div 
                        key={t}
                        onClick={() => { setType(t); setIsDropdownOpen(false); }}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontFamily: 'var(--font-heading)'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={`/plants/${t}.png`} alt={t} style={{ width: '28px', height: '28px', objectFit: 'contain', imageRendering: 'pixelated' }} onError={(e) => e.target.style.display='none'} />
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="device-id">Device ID <span style={{ color: 'var(--status-danger)', fontWeight: 600 }}>*</span></label>
                <input
                  id="device-id"
                  type="text"
                  placeholder="e.g., Planterra"
                  value={deviceId}
                  onChange={e => setDeviceId(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Must match the Device name from your IoT sensor
                </span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} id="add-plant-submit">
              {loading ? <span className="spinner" /> : 'Add Plant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
