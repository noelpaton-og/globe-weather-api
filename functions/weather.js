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

  const clientHeaders = event.headers || {};
  if (clientHeaders["x-api-key"] !== privateKey) {
    return {
      statusCode: 401,
      headers,
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
      body: JSON.stringify({ error: err.message }),
    };
  }
};
