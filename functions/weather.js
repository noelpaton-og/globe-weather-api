const axios = require("axios");

exports.handler = async (event) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const privateKey = process.env.PRIVATE_API_KEY;

  const origin = event.headers.origin || "*";
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };

  // Handle CORS preflight (OPTIONS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "OK",
    };
  }

  // Normalize header keys to lowercase
  const clientHeaders = {};
  for (let key in event.headers) {
    clientHeaders[key.toLowerCase()] = event.headers[key];
  }

  // Allow unauthenticated health check (for RapidAPI)
  if (event.path.includes("/ping")) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: "healthy" }),
    };
  }

  // API key validation
  if (clientHeaders["x-api-key"] !== privateKey) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized – Invalid API Key" }),
    };
  }

  const method = event.httpMethod;
  let city = "";

  if (method === "GET") {
    city = event.queryStringParameters?.city;
  } else if (method === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      city = body.city;
    } catch (err) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  if (!city) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing 'city' parameter" }),
    };
  }

  try {
    const res = await axios.get("https://api.weatherapi.com/v1/current.json", {
      params: {
        key: apiKey,
        q: city,
        aqi: "no",
      },
    });

    const { location, current } = res.data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        city: location.name,
        region: location.region,
        country: location.country,
        localtime: location.localtime,
        temperature_c: current.temp_c,
        temperature_f: current.temp_f,
        condition: current.condition.text,
        icon_url: `https:${current.condition.icon}`,
        wind_kph: current.wind_kph,
        humidity: current.humidity,
        feelslike_c: current.feelslike_c,
        uv_index: current.uv,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to fetch weather data", detail: err.message }),
    };
  }
};
