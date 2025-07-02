const axios = require("axios");

exports.handler = async (event) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const privateKey = process.env.PRIVATE_API_KEY;

  const origin = event.headers.origin || "*";
  const corsHeaders = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "OK",
    };
  }

  // Normalize headers (case-insensitive)
  const clientHeaders = {};
  for (let key in event.headers) {
    clientHeaders[key.toLowerCase()] = event.headers[key];
  }

  // Optional health check
  if (event.path.includes("/ping")) {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ status: "healthy" }),
    };
  }

  // API key check
  if (clientHeaders["x-api-key"] !== privateKey) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized – Invalid API Key" }),
    };
  }

  let city = "";

  if (event.httpMethod === "GET") {
    city = event.queryStringParameters?.city;
  } else if (event.httpMethod === "POST") {
    try {
      const body = JSON.parse(event.body || "{}");
      city = body.city;
    } catch (err) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }
  }

  if (!city) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing 'city' parameter" }),
    };
  }

  try {
    const res = await axios.get("https://api.weatherapi.com/v1/current.json", {
      params: {
        key: apiKey,
        q: city,
        aqi: "yes",
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(res.data.current.air_quality),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Failed to fetch air quality data",
        detail: err.message,
      }),
    };
  }
};
