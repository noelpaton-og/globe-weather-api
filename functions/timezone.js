const axios = require("axios");

exports.handler = async (event) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const privateKey = process.env.PRIVATE_API_KEY;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "OK",
    };
  }

  const headers = event.headers || {};
  if (headers["x-api-key"] !== privateKey) {
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  const method = event.httpMethod;
  let city = "";

  if (method === "GET") {
    city = event.queryStringParameters?.city;
  } else if (method === "POST") {
    const body = JSON.parse(event.body || "{}");
    city = body.city;
  }

  if (!city) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Missing 'city' parameter" }),
    };
  }

  try {
    const res = await axios.get("https://api.weatherapi.com/v1/timezone.json", {
      params: {
        key: apiKey,
        q: city,
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(res.data.location),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
