import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { Prediction } from './models.js';
import {
  createPredictions,
  geocodeLocation,
  getForecastPredictions,
  getHistoricalTemperatures
} from './weatherService.js';

const app = express();
const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/weather-app';

app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.get('/api/predict', async (req, res) => {
  try {
    const location = req.query.location?.trim();

    if (!location) {
      return res.status(400).json({ message: 'location query parameter is required.' });
    }

    const resolvedLocation = await geocodeLocation(location);
    const history = await getHistoricalTemperatures(
      resolvedLocation.latitude,
      resolvedLocation.longitude,
      resolvedLocation.timezone
    );
    let predictions;
    try {
      predictions = await getForecastPredictions(
        resolvedLocation.latitude,
        resolvedLocation.longitude,
        resolvedLocation.timezone
      );
    } catch {
      predictions = createPredictions(history);
    }

    const saved = await Prediction.create({
      locationQuery: location,
      resolvedLocation,
      history,
      predictions
    });

    res.json({
      id: saved._id,
      locationQuery: location,
      resolvedLocation,
      history,
      predictions
    });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Prediction failed.' });
  }
});

app.get('/api/recent', async (_req, res) => {
  const recent = await Prediction.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .select('locationQuery resolvedLocation createdAt predictions');

  res.json(recent);
});

async function startServer() {
  try {
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
