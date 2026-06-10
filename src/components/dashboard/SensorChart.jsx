import { useRef, useEffect, useState, useCallback } from 'react';

const COLORS = {
  temperature: { line: '#f97316', fill: 'rgba(249, 115, 22, 0.1)', gradient: ['rgba(249, 115, 22, 0.3)', 'rgba(249, 115, 22, 0)'] },
  airHumidity: { line: '#38bdf8', fill: 'rgba(56, 189, 248, 0.1)', gradient: ['rgba(56, 189, 248, 0.3)', 'rgba(56, 189, 248, 0)'] },
  soilHumidity: { line: '#a78bfa', fill: 'rgba(167, 139, 250, 0.1)', gradient: ['rgba(167, 139, 250, 0.3)', 'rgba(167, 139, 250, 0)'] },
};

const SERIES_LABELS = {
  temperature: 'Temperature',
  airHumidity: 'Air Humidity',
  soilHumidity: 'Soil Humidity',
};

function formatTime(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function SensorChart({ data, timeRange = '24h' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [hiddenSeries, setHiddenSeries] = useState(new Set());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0 || dimensions.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const w = dimensions.width;
    const h = dimensions.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Determine visible series
    const seriesKeys = ['temperature', 'airHumidity', 'soilHumidity'].filter(k => !hiddenSeries.has(k));
    if (seriesKeys.length === 0) return;

    // Calculate Y range across all visible series
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const key of seriesKeys) {
      for (const d of data) {
        const v = d[key];
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }

    // Add padding to Y range
    const yPad = (yMax - yMin) * 0.1 || 5;
    yMin = Math.floor(yMin - yPad);
    yMax = Math.ceil(yMax + yPad);

    function xPos(i) {
      return padding.left + (i / (data.length - 1)) * chartW;
    }

    function yPos(v) {
      return padding.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
    }

    // Draw grid lines
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.06)';
    ctx.lineWidth = 1;

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const yVal = yMin + ((yMax - yMin) * i) / yTicks;
      const y = yPos(yVal);

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Y labels
      ctx.fillStyle = 'rgba(148, 163, 176, 0.6)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(yVal.toFixed(0), padding.left - 8, y);
    }

    // X labels
    const xLabelCount = Math.min(6, data.length);
    const xStep = Math.floor(data.length / xLabelCount);
    ctx.fillStyle = 'rgba(148, 163, 176, 0.6)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < data.length; i += xStep) {
      const x = xPos(i);
      ctx.fillText(formatTime(data[i].timestamp), x, h - padding.bottom + 10);
    }

    // Draw each series
    for (const key of seriesKeys) {
      const color = COLORS[key];
      const points = data.map((d, i) => ({ x: xPos(i), y: yPos(d[key]) }));

      // Draw gradient fill
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }

      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.lineTo(points[0].x, padding.top + chartH);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, color.gradient[0]);
      gradient.addColorStop(1, color.gradient[1]);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }

      ctx.strokeStyle = color.line;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [data, dimensions, hiddenSeries]);

  useEffect(() => {
    draw();
  }, [draw]);

  function handleMouseMove(e) {
    if (!data || data.length === 0 || dimensions.width === 0) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const padding = { left: 50, right: 20 };
    const chartW = dimensions.width - padding.left - padding.right;
    const relX = mouseX - padding.left;

    if (relX < 0 || relX > chartW) {
      setTooltip(null);
      return;
    }

    const idx = Math.round((relX / chartW) * (data.length - 1));
    const d = data[idx];
    if (!d) { setTooltip(null); return; }

    setTooltip({
      x: mouseX,
      y: e.clientY - rect.top,
      time: formatTime(d.timestamp),
      temperature: d.temperature.toFixed(1),
      airHumidity: d.airHumidity.toFixed(1),
      soilHumidity: d.soilHumidity.toFixed(1),
      relay: d.relay,
    });
  }

  function toggleSeries(key) {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="chart-section">
      <div className="chart-header">
        <h3>Sensor History</h3>
      </div>

      <div className="chart-canvas-container" ref={containerRef} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)}>
        <canvas ref={canvasRef} />

        {tooltip && (
          <div
            className="chart-tooltip chart-tooltip--visible"
            style={{
              left: `${Math.min(tooltip.x + 12, dimensions.width - 160)}px`,
              top: `${Math.max(tooltip.y - 80, 10)}px`,
            }}
          >
            <div style={{ marginBottom: 4, fontWeight: 600, color: 'var(--text-primary)' }}>{tooltip.time}</div>
            {!hiddenSeries.has('temperature') && (
              <div style={{ color: COLORS.temperature.line }}>Temp: {tooltip.temperature} C</div>
            )}
            {!hiddenSeries.has('airHumidity') && (
              <div style={{ color: COLORS.airHumidity.line }}>Air H: {tooltip.airHumidity}%</div>
            )}
            {!hiddenSeries.has('soilHumidity') && (
              <div style={{ color: COLORS.soilHumidity.line }}>Soil H: {tooltip.soilHumidity}%</div>
            )}
            {tooltip.relay === 1 && (
              <div style={{ color: 'var(--green-400)', marginTop: 2, fontWeight: 500 }}>Watering Active</div>
            )}
          </div>
        )}
      </div>

      <div className="chart-legend">
        {Object.entries(SERIES_LABELS).map(([key, label]) => (
          <button
            key={key}
            className={`chart-legend-item ${hiddenSeries.has(key) ? 'chart-legend-item--hidden' : ''}`}
            onClick={() => toggleSeries(key)}
            id={`chart-legend-${key}`}
          >
            <span className="chart-legend-dot" style={{ background: COLORS[key].line }} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
