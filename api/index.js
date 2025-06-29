const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// API Key Middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  const userKey = req.headers['x-api-key'];
  if (!userKey || userKey !== PRIVATE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

const cache = new NodeCache({ stdTTL: 300 });

app.get('/weather', async (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: 'City is required' });

  const cached = cache.get(city);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('http://api.weatherapi.com/v1/current.json', {
      params: { key: WEATHER_API_KEY, q: city, aqi: 'no' }
    });

    const data = response.data;
    const formatted = {
      city: data.location.name,
      region: data.location.region,
      country: data.location.country,
      localtime: data.location.localtime,
      temperature_c: data.current.temp_c,
      temperature_f: data.current.temp_f,
      condition: data.current.condition.text,
      icon_url: `https:${data.current.condition.icon}`,
      wind_kph: data.current.wind_kph,
      humidity: data.current.humidity,
      feelslike_c: data.current.feelslike_c,
      uv_index: data.current.uv
    };

    cache.set(city, formatted);
    res.json(formatted);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch weather data',
      message: err.message
    });
  }
});

app.get('/forecast', async (req, res) => {
  const city = req.query.city?.toLowerCase();
  if (!city) return res.status(400).json({ error: 'City is required' });

  const cacheKey = `forecast_${city}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        days: 3,
        aqi: 'no',
        alerts: 'no'
      }
    });

    const data = response.data;

    const forecastData = data.forecast.forecastday.map(day => ({
      date: day.date,
      maxtemp_c: day.day.maxtemp_c,
      mintemp_c: day.day.mintemp_c,
      condition: day.day.condition.text,
      icon_url: `https:${day.day.condition.icon}`,
      chance_of_rain: day.day.daily_chance_of_rain,
      uv_index: day.day.uv
    }));

    const result = {
      city: data.location.name,
      country: data.location.country,
      forecast: forecastData
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch forecast data',
      message: err.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// 👇 Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
