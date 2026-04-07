import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    locationQuery: { type: String, required: true, trim: true },
    resolvedLocation: {
      name: { type: String, required: true },
      country: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      timezone: { type: String, required: true }
    },
    history: [
      {
        date: String,
        max: Number,
        min: Number,
        avg: Number
      }
    ],
    predictions: [
      {
        date: String,
        predictedAvg: Number
      }
    ]
  },
  { timestamps: true }
);

export const Prediction = mongoose.model('Prediction', predictionSchema);
