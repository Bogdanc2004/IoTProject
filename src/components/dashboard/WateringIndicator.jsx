function WaterDropIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'N/A';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function WateringIndicator({ data }) {
  if (!data || data.length === 0) return null;

  const latest = data[data.length - 1];
  const isActive = latest.relay === 1;

  // Find last watering event
  let lastWateringTime = null;
  let wateringCount = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].relay === 1) {
      wateringCount++;
      if (!lastWateringTime) {
        lastWateringTime = data[i].timestamp;
      }
    }
  }

  return (
    <div className="watering-section">
      <div className="watering-card">
        <div className="watering-status">
          <div className={`watering-indicator ${isActive ? 'watering-indicator--active' : 'watering-indicator--inactive'}`}>
            <WaterDropIcon />
          </div>
          <div>
            <div className="watering-label">Water Pump</div>
            <div className={`watering-state ${isActive ? 'watering-state--active' : 'watering-state--inactive'}`}>
              {isActive ? 'Active' : 'Standby'}
            </div>
          </div>
        </div>

        <div className="watering-details">
          <div className="watering-detail">
            <span className="watering-detail-label">Last watering</span>
            <span className="watering-detail-value">{formatTimeAgo(lastWateringTime)}</span>
          </div>
          <div className="watering-detail">
            <span className="watering-detail-label">Waterings (24h)</span>
            <span className="watering-detail-value">{wateringCount}</span>
          </div>
          <div className="watering-detail">
            <span className="watering-detail-label">Soil moisture</span>
            <span className="watering-detail-value">{latest.soilHumidity != null ? latest.soilHumidity.toFixed(1) : '—'}%</span>
          </div>
        </div>
      </div>

      <div className="watering-card">
        <div className="watering-status">
          <div className="watering-indicator watering-indicator--inactive" style={{ background: 'rgba(56, 189, 248, 0.15)', color: 'var(--air-color)' }}>
            <ClockIcon />
          </div>
          <div>
            <div className="watering-label">Sensor Status</div>
            <div className="watering-state watering-state--active" style={{ color: 'var(--air-color)' }}>
              Connected
            </div>
          </div>
        </div>

        <div className="watering-details">
          <div className="watering-detail">
            <span className="watering-detail-label">Last reading</span>
            <span className="watering-detail-value">{formatTimeAgo(latest.timestamp)}</span>
          </div>
          <div className="watering-detail">
            <span className="watering-detail-label">Data points</span>
            <span className="watering-detail-value">{data.length}</span>
          </div>
          <div className="watering-detail">
            <span className="watering-detail-label">Interval</span>
            <span className="watering-detail-value">1h</span>
          </div>
        </div>
      </div>
    </div>
  );
}
