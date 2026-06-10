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

function getStatusLabel(status) {
  switch (status) {
    case 'healthy': return 'Healthy';
    case 'warning': return 'Warning';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
}

function getMeasurementStatus(type, value) {
  if (type === 'temperature') {
    if (value > 35 || value < 10) return 'danger';
    if (value > 30 || value < 15) return 'warn';
    return 'good';
  }
  if (type === 'airHumidity') {
    if (value > 85 || value < 30) return 'danger';
    if (value > 75 || value < 40) return 'warn';
    return 'good';
  }
  if (type === 'soilHumidity') {
    if (value > 90 || value < 20) return 'danger';
    if (value > 80 || value < 30) return 'warn';
    return 'good';
  }
  return 'good';
}

export default function PlantCard({ plant, latestReading, onClick }) {
  let status = plant.status || 'healthy';

  if (latestReading) {
    const statuses = [
      getMeasurementStatus('temperature', latestReading.temperature),
      getMeasurementStatus('airHumidity', latestReading.airHumidity),
      getMeasurementStatus('soilHumidity', latestReading.soilHumidity)
    ];
    
    const dangerCount = statuses.filter(s => s === 'danger').length;
    const warnCount = statuses.filter(s => s === 'warn').length;

    if (dangerCount >= 1) {
      status = 'critical';
    } else if (warnCount >= 2) {
      status = 'warning';
    } else {
      status = 'healthy';
    }
  }

  return (
    <div className="plant-card" onClick={onClick} id={`plant-card-${plant.id}`}>
      <div className="plant-card-image">
        <img 
          src={`/plants/${plant.type}.png`} 
          alt={plant.type}
          style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
        />
        <div style={{ display: 'none' }}><PlantSvgIcon /></div>
        <span className={`plant-card-status plant-card-status--${status}`}>
          {getStatusLabel(status)}
        </span>
      </div>

      <div className="plant-card-body">
        <h3 className="plant-card-name">{plant.name}</h3>
        <p className="plant-card-type">{plant.type}</p>

        {latestReading && (
          <div className="plant-card-readings">
            <div className="plant-card-reading-group">
              <span className="plant-card-reading plant-card-reading--temp">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
                </svg>
                {latestReading.temperature.toFixed(1)}°
              </span>
              <span className="plant-card-reading-target">15-30°C</span>
            </div>
            <div className="plant-card-reading-group">
              <span className="plant-card-reading plant-card-reading--air">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
                {latestReading.airHumidity.toFixed(1)}%
              </span>
              <span className="plant-card-reading-target">40-75%</span>
            </div>
            <div className="plant-card-reading-group">
              <span className="plant-card-reading plant-card-reading--soil">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
                </svg>
                {latestReading.soilHumidity.toFixed(1)}%
              </span>
              <span className="plant-card-reading-target">30-80%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
