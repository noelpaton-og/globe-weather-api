const axios = require("axios");

exports.handler = async (event) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const privateKey = process.env.PRIVATE_API_KEY;

  const headers = event.headers || {};
  if (headers["x-api-key"] !== privateKey) {
    return {
      statusCode: 401,
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
      body: JSON.stringify(res.data.current.air_quality),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
