# globe-weather-api

Globe Weather API
------------------

A fast and secure RESTful API to get real-time weather data by city using data from WeatherAPI.com. The API is protected with a private key to prevent unauthorized access.

Base URL:
---------

https://your-deployment-url.com

Usage:
------

Endpoint:
  GET /weather?city={city_name}

Headers:
  x-api-key: your_public_api_key

Example Request:
  GET /weather?city=London
  Header: x-api-key: your_public_api_key

Example Response:
  {
    "city": "Tokyo",
    "region": "Tokyo",
    "country": "Japan",
    "localtime": "2025-06-29 12:21",
    "temperature_c": 32.4,
    "temperature_f": 90.3,
    "condition": "Partly cloudy",
    "icon_url": "https://cdn.weatherapi.com/weather/64x64/day/116.png",
    "wind_kph": 18.7,
    "humidity": 56,
    "feelslike_c": 35.6,
    "uv_index": 10.3
  }

Additional Endpoint:
--------------------

GET /health

Use this to check if the API is up and running.

Response:
  {
    "status": "ok",
    "uptime": 123.45,
    "timestamp": "2025-06-29T12:00:00.000Z"
  }

Rate Limits:
------------

60 requests per minute per IP address.

Authorization:
--------------

All requests must include the correct x-api-key header. Requests without it will return:
  {
    "error": "Unauthorized"
  }

License:
--------

This project is licensed under the MIT License.
See LICENSE.txt for full terms.
