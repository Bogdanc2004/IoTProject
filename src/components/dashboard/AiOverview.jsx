import { useEffect, useState } from 'react';
import { generateAiOverview } from '../../services/aiOverview';

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

export default function AiOverview({ plant, stats, latest, loading }) {
  const [typedSegments, setTypedSegments] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [severity, setSeverity] = useState('good');

  useEffect(() => {
    if (loading || !plant || !stats || !latest) return;
    
    setIsTyping(true);
    setTypedSegments([]);
    const result = generateAiOverview(plant, stats, latest);
    setSeverity(result.severity);
    
    const segments = result.segments;
    
    let currentSegmentIndex = 0;
    let currentCharIndex = 0;
    let newTypedSegments = [];
    
    const interval = setInterval(() => {
      if (currentSegmentIndex < segments.length) {
        const seg = segments[currentSegmentIndex];
        
        if (!newTypedSegments[currentSegmentIndex]) {
          newTypedSegments[currentSegmentIndex] = { text: '', type: seg.type };
        }
        
        newTypedSegments[currentSegmentIndex].text += seg.text.charAt(currentCharIndex);
        setTypedSegments([...newTypedSegments]);
        
        currentCharIndex++;
        if (currentCharIndex >= seg.text.length) {
          currentSegmentIndex++;
          currentCharIndex = 0;
        }
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15); // ms per character

    return () => clearInterval(interval);
  }, [plant, stats, latest, loading]);

  if (loading || !plant) {
    return (
      <div className="ai-overview-card ai-overview-card--loading">
        <div className="spinner" />
        <span>Analyzing plant data...</span>
      </div>
    );
  }

  return (
    <div className={`ai-overview-card ${severity !== 'good' ? `ai-overview-card--${severity === 'danger' ? 'critical' : severity}` : ''}`}>
      <div className="ai-overview-header">
        <div className="ai-overview-icon">
          <SparkleIcon />
        </div>
        <h3>AI Plant Analysis</h3>
      </div>
      <div className="ai-overview-content">
        <p>
          {typedSegments.map((seg, i) => (
            <span key={i} className={seg.type !== 'normal' ? `text-${seg.type}` : ''}>
              {seg.text}
            </span>
          ))}
          {isTyping && <span className="typing-cursor" />}
        </p>
      </div>
    </div>
  );
}
