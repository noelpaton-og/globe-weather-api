from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
import requests
import os
import time
from mangum import Mangum  # Adapter for AWS Lambda (used by Vercel)

# Initialize FastAPI app
app = FastAPI()

# Get environment variables
WEATHER_API_KEY = os.environ.get("WEATHER_API_KEY")
PRIVATE_API_KEY = os.environ.get("PRIVATE_API_KEY")

# Validate environment variables
if not WEATHER_API_KEY or not PRIVATE_API_KEY:
    raise RuntimeError("Missing WEATHER_API_KEY or PRIVATE_API_KEY in environment")

# --- Pydantic models ---

class WeatherResponse(BaseModel):
    city: str
    region: Optional[str]
    country: str
    localtime: str
    temperature_c: float
    temperature_f: float
    condition: str
    icon_url: str
    wind_kph: float
    humidity: int
    feelslike_c: float
    uv_index: float

class ForecastDay(BaseModel):
    date: str
    maxtemp_c: float
    mintemp_c: float
    condition: str
    icon_url: str
    chance_of_rain: Optional[int]
    uv_index: float

class ForecastResponse(BaseModel):
    city: str
    country: str
    forecast: List[ForecastDay]

# --- API Key Validation ---

def validate_api_key(x_api_key: str):
    if x_api_key != PRIVATE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# --- Weather Endpoint ---

@app.get("/weather", response_model=WeatherResponse)
def get_weather(city: str, x_api_key: str = Header(...)):
    validate_api_key(x_api_key)

    try:
        res = requests.get(
            "https://api.weatherapi.com/v1/current.json",
            params={"key": WEATHER_API_KEY, "q": city, "aqi": "no"},
            timeout=7
        )
        res.raise_for_status()
        data = res.json()

        current = data["current"]
        location = data["location"]

        return WeatherResponse(
            city=location["name"],
            region=location.get("region"),
            country=location["country"],
            localtime=location["localtime"],
            temperature_c=current["temp_c"],
            temperature_f=current["temp_f"],
            condition=current["condition"]["text"],
            icon_url=f"https:{current['condition']['icon']}",
            wind_kph=current["wind_kph"],
            humidity=current["humidity"],
            feelslike_c=current["feelslike_c"],
            uv_index=current["uv"]
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching weather: {e}")

# --- Forecast Endpoint ---

@app.get("/forecast", response_model=ForecastResponse)
def get_forecast(city: str, x_api_key: str = Header(...)):
    validate_api_key(x_api_key)

    try:
        res = requests.get(
            "https://api.weatherapi.com/v1/forecast.json",
            params={"key": WEATHER_API_KEY, "q": city, "days": 3, "aqi": "no", "alerts": "no"},
            timeout=7
        )
        res.raise_for_status()
        data = res.json()

        forecast = [
            ForecastDay(
                date=day["date"],
                maxtemp_c=day["day"]["maxtemp_c"],
                mintemp_c=day["day"]["mintemp_c"],
                condition=day["day"]["condition"]["text"],
                icon_url=f"https:{day['day']['condition']['icon']}",
                chance_of_rain=day["day"].get("daily_chance_of_rain"),
                uv_index=day["day"]["uv"],
            )
            for day in data["forecast"]["forecastday"]
        ]

        return ForecastResponse(
            city=data["location"]["name"],
            country=data["location"]["country"],
            forecast=forecast
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error fetching forecast: {e}")

# --- Health Check Endpoint ---

@app.get("/health")
def health():
    return {
        "status": "ok",
        "uptime_seconds": int(time.perf_counter()),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

# --- Root Test Endpoint ---

@app.get("/")
def root():
    return {"message": "API is alive"}

# --- Vercel Handler ---

handler = Mangum(app)
