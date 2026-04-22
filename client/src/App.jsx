import { useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

function formatLabel(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
}

export default function App() {
  const [location, setLocation] = useState('New York');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chartPoints = useMemo(() => {
    if (!result?.predictions) {
      return '';
    }

    const values = result.predictions.map((entry) => entry.predictedAvg);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return result.predictions
      .map((entry, index) => {
        const x = (index / (values.length - 1 || 1)) * 100;
        const y = 100 - ((entry.predictedAvg - min) / (max - min || 1)) * 100;
        return `${x},${y}`;
      })
      .join(' ');
  }, [result]);

  async function fetchRecent() {
    const response = await fetch(`${API_BASE}/api/recent`);
    const data = await response.json();
    setRecent(data);
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/predict?location=${encodeURIComponent(location)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to retrieve prediction.');
      }

      setResult(data);
      await fetchRecent();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <div className="aurora aurora-one" aria-hidden="true" />
      <div className="aurora aurora-two" aria-hidden="true" />

      <section className="hero card">
        <h1>Weather Prediction</h1>
        <p>Predict upcoming temperature trends for any location using historical weather data.</p>
      </section>

      <form onSubmit={submit} className="card form">
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Enter city or region"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Predicting...' : 'Get Forecast'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card fade-in">
          <h2>
            {result.resolvedLocation.name}, {result.resolvedLocation.country}
          </h2>
          <svg viewBox="0 0 100 100" className="chart" preserveAspectRatio="none">
            <polyline fill="none" stroke="currentColor" strokeWidth="2" points={chartPoints} />
          </svg>

          <div className="grid">
            {result.predictions.map((prediction, index) => (
              <article key={prediction.date} className="prediction" style={{ '--delay': `${index * 70}ms` }}>
                <strong>{formatLabel(prediction.date)}</strong>
                <p>{prediction.predictedAvg.toFixed(1)}°C</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h3>Recent Searches</h3>
        {!recent.length && <p>No searches yet.</p>}
        <ul className="recent-list">
          {recent.map((item) => (
            <li key={item._id}>
              <span>
                {item.resolvedLocation.name}, {item.resolvedLocation.country}
              </span>
              <time>{new Date(item.createdAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
