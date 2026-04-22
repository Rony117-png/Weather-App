const OPEN_METEO_GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const formatDate = (date) => date.toISOString().split('T')[0];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function linearRegression(values) {
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

export async function geocodeLocation(location) {
  const params = new URLSearchParams({
    name: location,
    count: '1',
    language: 'en',
    format: 'json'
  });

  const response = await fetch(`${OPEN_METEO_GEOCODE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to geocode location.');
  }

  const data = await response.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('Location not found.');
  }

  const [result] = data.results;

  return {
    name: result.name,
    country: result.country,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone
  };
}

export async function getHistoricalTemperatures(latitude, longitude, timezone) {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 29);

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone
  });

  const response = await fetch(`${OPEN_METEO_ARCHIVE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to retrieve historical weather data.');
  }

  const data = await response.json();

  if (!data.daily?.time?.length) {
    throw new Error('No historical weather data available for that location.');
  }

  return data.daily.time.map((date, index) => {
    const max = data.daily.temperature_2m_max[index];
    const min = data.daily.temperature_2m_min[index];
    return {
      date,
      max,
      min,
      avg: Number(((max + min) / 2).toFixed(2))
    };
  });
}

export async function getForecastPredictions(latitude, longitude, timezone, days = 7) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone,
    forecast_days: String(days)
  });

  const response = await fetch(`${OPEN_METEO_FORECAST_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Unable to retrieve forecast weather data.');
  }

  const data = await response.json();

  if (!data.daily?.time?.length) {
    throw new Error('No forecast weather data available for that location.');
  }

  return data.daily.time.map((date, index) => {
    const max = data.daily.temperature_2m_max[index];
    const min = data.daily.temperature_2m_min[index];

    return {
      date,
      predictedAvg: Number(((max + min) / 2).toFixed(2))
    };
  });
}

export function createPredictions(history, days = 7) {
  const averages = history.map((item) => item.avg);
  const { slope, intercept } = linearRegression(averages);

  const lastDate = new Date(history[history.length - 1].date);
  const historicalMin = Math.min(...averages);
  const historicalMax = Math.max(...averages);

  return Array.from({ length: days }, (_, offset) => {
    const predictionIndex = averages.length + offset;
    const rawValue = intercept + slope * predictionIndex;
    const normalized = clamp(rawValue, historicalMin - 8, historicalMax + 8);

    const date = new Date(lastDate);
    date.setDate(lastDate.getDate() + offset + 1);

    return {
      date: formatDate(date),
      predictedAvg: Number(normalized.toFixed(2))
    };
  });
}
