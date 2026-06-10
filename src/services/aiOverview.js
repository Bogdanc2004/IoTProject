/**
 * Generates an AI-like overview based on the plant's recent sensor statistics.
 * In a real application, this might call an LLM API (like AWS Bedrock or OpenAI) 
 * passing in the plant type and recent sensor data.
 */

export function generateAiOverview(plant, stats, latest) {
  if (!plant || !stats || !latest) {
    return { hasIssues: false, segments: [{ text: "Gathering enough data to generate an AI overview...", type: 'normal' }] };
  }

  const { temperature, airHumidity, soilHumidity, wateringCount } = stats;
  let segments = [];
  
  segments.push({ text: `Based on the last 24 hours of data, your ${plant.type} (${plant.name}) is doing well overall. `, type: 'normal' });
  
  let issues = [];
  let recommendations = [];
  let maxSeverity = 'good';

  // Helper to add issues
  const addIssue = (text, type, rec) => {
    issues.push({ text, type });
    recommendations.push(rec);
    if (type === 'danger' || (type === 'warn' && maxSeverity !== 'danger')) {
      maxSeverity = type;
    }
  };

  // Temperature analysis
  if (latest.temperature > 35) {
    addIssue("experiencing critically high temperatures", "danger", "Move it to a cooler spot immediately to prevent heat damage.");
  } else if (latest.temperature > 30) {
    addIssue("experiencing higher than optimal temperatures", "warn", "Consider moving it to a cooler spot or improving ventilation.");
  } else if (latest.temperature < 10) {
    addIssue("experiencing critically low temperatures", "danger", "Move it to a warmer location immediately to prevent freezing.");
  } else if (latest.temperature < 15) {
    addIssue("experiencing lower than optimal temperatures", "warn", "Ensure it is not exposed to cold drafts.");
  }

  // Air Humidity analysis
  if (latest.airHumidity < 30) {
    addIssue("in a critically dry environment", "danger", "Use a humidifier immediately to prevent leaves from crisping.");
  } else if (latest.airHumidity < 40) {
    addIssue("in a somewhat dry environment", "warn", "You might want to mist the leaves or use a humidifier.");
  } else if (latest.airHumidity > 85) {
    addIssue("in a critically humid environment", "danger", "Improve air circulation immediately to prevent severe fungal infections.");
  } else if (latest.airHumidity > 75) {
    addIssue("in a highly humid environment", "warn", "Ensure good air circulation to prevent fungal growth.");
  }

  // Soil Humidity analysis
  if (latest.soilHumidity < 20) {
    addIssue("the soil is critically dry", "danger", "Water it immediately to prevent wilting.");
  } else if (latest.soilHumidity < 30) {
    addIssue("the soil is getting quite dry", "warn", "The automated watering system should trigger soon, or you can manually water it.");
  } else if (latest.soilHumidity > 90) {
    addIssue("the soil is critically waterlogged", "danger", "Drain excess water immediately to prevent root suffocation.");
  } else if (latest.soilHumidity > 80) {
    addIssue("the soil is very wet", "warn", "Make sure the pot has proper drainage to avoid root rot.");
  }

  if (issues.length > 0) {
    segments.push({ text: "However, it is currently ", type: 'normal' });
    issues.forEach((issue, index) => {
      segments.push(issue);
      if (index < issues.length - 1) {
        segments.push({ text: " and ", type: 'normal' });
      }
    });
    segments.push({ text: ". " + recommendations.join(" "), type: 'normal' });
  } else {
    segments.push({ text: "All environmental factors (temperature, air humidity, and soil moisture) are within optimal ranges. Keep up the good work!", type: 'normal' });
  }

  if (wateringCount > 0) {
    segments.push({ text: ` The automated pump successfully watered the plant ${wateringCount} time(s) in the last 24 hours to maintain soil moisture.`, type: 'normal' });
  } else if (issues.length === 0) {
    segments.push({ text: " No automated watering was necessary in the last 24 hours as moisture levels remained adequate.", type: 'normal' });
  }

  return { severity: maxSeverity, segments };
}
