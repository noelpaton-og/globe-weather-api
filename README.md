# Global Weather API

The **Global Weather API** provides real-time weather and environmental data for cities around the world. It offers simple, RESTful endpoints that allow developers to fetch current weather, 5-day forecasts, air quality, astronomical data, and timezone information using only a city name.

---

## Base URL

```
https://globe-weather-api.netlify.app/.netlify/functions
```

---

## Endpoints

| Endpoint      | Description                              | Example                        |
| ------------- | ---------------------------------------- | ------------------------------ |
| `/weather`    | Current weather data for a city          | `/weather?city=London`         |
| `/forecast`   | 5-day weather forecast                   | `/forecast?city=Tokyo`         |
| `/airquality` | Air quality index and pollutant levels   | `/airquality?city=Los Angeles` |
| `/astronomy`  | Sunrise, sunset, moonrise, moonset times | `/astronomy?city=Cairo`        |
| `/timezone`   | Current local time and timezone info     | `/timezone?city=Sydney`        |

&gt; All endpoints require the `city` query parameter.

---

## Example Request

**GET** `/weather?city=New York`

**Response**

```json
{
  "city": "New York",
  "temperature": "26°C",
  "description": "Partly cloudy",
  "humidity": "60%",
  "wind_speed": "14 km/h"
}
```

---

## How to Use

1. Select the endpoint you need.
2. Add the `city` parameter in the query string.
3. Send a GET request using any HTTP client (like `fetch`, `axios`, or Postman).
4. Receive JSON-formatted weather data.

---

## Features

* Easy-to-use RESTful interface
* Global city coverage
* No API key required (public access)
* Optimized for speed and simplicity
