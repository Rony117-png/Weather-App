# Weather-App (MERN)

A weather prediction web application that accepts any location, fetches historical weather data, and predicts the next 7 days of average temperature trend.

## Tech Stack

- **MongoDB** for persistence of recent prediction searches.
- **Express + Node.js** for API routes and prediction logic.
- **React + Vite** for the user interface.

## Features

- Search weather prediction by city or region.
- Uses geocoding + archive weather APIs (Open-Meteo).
- Creates a simple linear-regression trend forecast for 7 upcoming days.
- Stores prediction history in MongoDB.
- Displays recent searches.

## Project Structure

- `server/`: Express + Mongoose backend
- `client/`: React frontend

## Setup

### 1) Install dependencies

```bash
npm run install:all
```

### 2) Configure environment

Create `server/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/weather-app
```

### 3) Run backend

```bash
npm run dev:server
```

### 4) Run frontend

```bash
npm run dev:client
```

Then open `http://localhost:5173`.

## API

### `GET /api/predict?location=<query>`
Returns resolved location, historical data, and 7-day predictions.

### `GET /api/recent`
Returns 10 most recent saved predictions.

### `GET /api/health`
Health check endpoint.
