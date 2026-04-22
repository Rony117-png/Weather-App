import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

function formatLabel(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(dateString));
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString));
}

export default function App() {
  const [location, setLocation] = useState('New York');
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chartPath = useMemo(() => {
    if (!result?.predictions?.length) {
      return '';
    }

    const values = result.predictions.map((entry) => entry.predictedAvg);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return result.predictions
      .map((entry, index) => {
        const x = (index / (values.length - 1 || 1)) * 400;
        const y = 95 - ((entry.predictedAvg - min) / (max - min || 1)) * 75;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [result]);

  const chartAreaPath = useMemo(() => {
    if (!chartPath) {
      return '';
    }

    const lineWithoutMove = chartPath.replace(/^M\s*/, '');
    return `M ${lineWithoutMove} L 400 100 L 0 100 Z`;
  }, [chartPath]);

  async function fetchRecent() {
    const response = await fetch(`${API_BASE}/api/recent`);
    const data = await response.json();
    setRecent(data);
  }

  useEffect(() => {
    fetchRecent().catch(() => {});
  }, []);

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

  const resolvedName = result
    ? `${result.resolvedLocation.name}, ${result.resolvedLocation.country}`
    : 'Search a location';

  const currentTemp = result?.predictions?.[0]?.predictedAvg;

  return (
    <div className="skyglass-app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            ☁
          </span>
          <span className="brand-name">SkyGlass</span>
        </div>
      </header>

      <main className="shell">
        <section className="search-wrap">
          <form onSubmit={submit} className="search-form">
            <span aria-hidden="true">📍</span>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Search city or zip code..."
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Get Forecast'}
            </button>
          </form>
        </section>

        {error && <p className="error">{error}</p>}

        <section className="dashboard-grid">
          <article className="glass hero-card">
            <div className="hero-header">
              <p className="location">{resolvedName}</p>
              <p className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="temp-row">
              <strong>{typeof currentTemp === 'number' ? `${currentTemp.toFixed(1)}°` : '--'}</strong>
              <span>C</span>
            </div>

            <p className="hero-subtitle">Predicted average trend for the upcoming week.</p>

            {chartPath && (
              <div className="chart-wrap">
                <svg viewBox="0 0 400 100" className="chart" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#4b8eff" />
                      <stop offset="100%" stopColor="#74d1ff" />
                    </linearGradient>
                  </defs>
                  <path d={chartAreaPath} className="chart-area" />
                  <path d={chartPath} className="chart-line" />
                </svg>
              </div>
            )}
          </article>

          <aside className="metrics">
            <article className="glass metric">
              <p>Predictions</p>
              <strong>{result?.predictions?.length ?? 0} days</strong>
            </article>
            <article className="glass metric">
              <p>Latest Search</p>
              <strong>{recent[0] ? formatTime(recent[0].createdAt) : '--:--'}</strong>
            </article>
            <article className="glass metric">
              <p>Saved Locations</p>
              <strong>{recent.length}</strong>
            </article>
          </aside>
        </section>

        {result?.predictions && (
          <section className="glass forecast">
            <div className="forecast-head">
              <h2>7-Day Forecast</h2>
            </div>
            <div className="forecast-scroll">
              {result.predictions.map((prediction, index) => (
                <article key={prediction.date} className="day-card" style={{ '--delay': `${index * 70}ms` }}>
                  <p>{index === 0 ? 'Today' : formatLabel(prediction.date)}</p>
                  <strong>{prediction.predictedAvg.toFixed(1)}°</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="glass recent">
          <h3>Recent Searches</h3>
          {!recent.length && <p>No searches yet.</p>}
          <ul>
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
    </div>
  );
}
