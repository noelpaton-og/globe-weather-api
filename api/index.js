const express = require('express');
const axios = require('axios');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY;

// Check env vars early
if (!WEATHER_API_KEY) {
  console.error('ERROR: WEATHER_API_KEY is not set');
}
if (!PRIVATE_API_KEY) {
  console.error('ERROR: PRIVATE_API_KEY is not set');
}

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rate limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// API Key Middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();

  const userKey = req.headers['x-api-key'];
  if (!userKey || userKey !== PRIVATE_API_KEY) {
    console.log(`Unauthorized access attempt to ${req.path} with key: ${userKey}`);
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

const cache = new NodeCache({ stdTTL: 300 });

// Weather endpoint
app.get('/weather', async (req, res) => {
  console.log('GET /weather', req.query);

  const city = req.query.city?.toLowerCase();
  if (!city) {
    console.log('City is required');
    return res.status(400).json({ error: 'City is required' });
  }

  const cached = cache.get(city);
  if (cached) {
    console.log('Returning cached weather for:', city);
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: { key: WEATHER_API_KEY, q: city, aqi: 'no' },
      timeout: 7000
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
    console.error('Error fetching weather:', err.message);
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch weather data',
      message: err.message
    });
  }
});

// Forecast endpoint
app.get('/forecast', async (req, res) => {
  console.log('GET /forecast', req.query);

  const city = req.query.city?.toLowerCase();
  if (!city) {
    console.log('City is required');
    return res.status(400).json({ error: 'City is required' });
  }

  const cacheKey = `forecast_${city}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log('Returning cached forecast for:', city);
    return res.json(cached);
  }

  try {
    const response = await axios.get('https://api.weatherapi.com/v1/forecast.json', {
      params: {
        key: WEATHER_API_KEY,
        q: city,
        days: 3,
        aqi: 'no',
        alerts: 'no'
      },
      timeout: 7000
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
    console.error('Error fetching forecast:', err.message);
    res.status(err.response?.status || 500).json({
      error: 'Failed to fetch forecast data',
      message: err.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Export for Vercel
const serverless = require('serverless-http');
module.exports = serverless(app);
