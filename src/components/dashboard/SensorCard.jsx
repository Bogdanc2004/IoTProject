function ThermometerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function MoistureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
      <path d="M9.1 16.9a3 3 0 0 1-.9-2.2c0-1 .5-2 1.5-2.8" />
    </svg>
  );
}

const SENSOR_CONFIG = {
  temperature: {
    icon: <ThermometerIcon />,
    label: 'Temperature',
    unit: '\u00B0C',
    className: 'sensor-card--temp',
    target: '15-30',
  },
  airHumidity: {
    icon: <DropletIcon />,
    label: 'Air Humidity',
    unit: '%',
    className: 'sensor-card--air',
    target: '40-75',
  },
  soilHumidity: {
    icon: <MoistureIcon />,
    label: 'Soil Humidity',
    unit: '%',
    className: 'sensor-card--soil',
    target: '30-80',
  },
};

function getStatusColor(type, value) {
  if (type === 'temperature') {
    if (value > 35 || value < 10) return 'var(--status-danger)';
    if (value > 30 || value < 15) return 'var(--status-warn)';
    return 'var(--status-good)';
  }
  if (type === 'airHumidity') {
    if (value > 85 || value < 30) return 'var(--status-danger)';
    if (value > 75 || value < 40) return 'var(--status-warn)';
    return 'var(--status-good)';
  }
  if (type === 'soilHumidity') {
    if (value > 90 || value < 20) return 'var(--status-danger)';
    if (value > 80 || value < 30) return 'var(--status-warn)';
    return 'var(--status-good)';
  }
  return 'var(--status-good)';
}

export default function SensorCard({ type, value, stats }) {
  const config = SENSOR_CONFIG[type];
  if (!config) return null;

  const statusColor = getStatusColor(type, value);
  const displayValue = typeof value === 'number' ? value.toFixed(1) : '--';

  return (
    <div className={`sensor-card ${config.className} animate-fade-in`} id={`sensor-card-${type}`}>
      <div className="sensor-card-header">
        <div className="sensor-card-icon">
          {config.icon}
        </div>
        <div
          className="sensor-status-ring"
          style={{ color: statusColor }}
        >
          <span className="status-dot" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        </div>
      </div>

      <div className="sensor-card-label">
        <span>{config.label}</span>
        <span className="sensor-card-target">Target: {config.target}{config.unit}</span>
      </div>

      <div className="sensor-card-value">
        {displayValue}
        <span className="sensor-card-unit">{config.unit}</span>
      </div>

      {stats && (
        <div className="sensor-card-stats">
          <div className="sensor-stat">
            <span className="sensor-stat-label">Min</span>
            <span className="sensor-stat-value">{stats.min}{config.unit}</span>
          </div>
          <div className="sensor-stat">
            <span className="sensor-stat-label">Avg</span>
            <span className="sensor-stat-value">{stats.avg}{config.unit}</span>
          </div>
          <div className="sensor-stat">
            <span className="sensor-stat-label">Max</span>
            <span className="sensor-stat-value">{stats.max}{config.unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}
