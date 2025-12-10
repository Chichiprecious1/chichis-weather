import React, { useState } from "react";
import axios from "axios";
import "./Weather.css";

// ---------- helpers ----------

// local date/time using timezone offset (seconds)
function formatLocalDate(timestamp, timezoneOffsetSeconds) {
  const local = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = days[local.getUTCDay()];
  const hours = local.getUTCHours().toString().padStart(2, "0");
  const minutes = local.getUTCMinutes().toString().padStart(2, "0");
  return `${day} ${hours}:${minutes}`;
}

// day name for forecast
function formatDay(timestamp, timezoneOffsetSeconds) {
  const local = new Date((timestamp + timezoneOffsetSeconds) * 1000);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[local.getUTCDay()];
}

// country code → flag emoji
function countryFlag(code) {
  if (!code) return "";
  const base = 127397;
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(base + c.charCodeAt(0)))
    .join("");
}

// map OpenWeather icon codes
function emojiIcon(iconCode) {
  switch (iconCode) {
    case "01d":
      return "https://img.icons8.com/emoji/96/sun-emoji.png"; // clear day
    case "01n":
      return "https://img.icons8.com/emoji/96/crescent-moon-emoji.png";
    case "02d":
    case "02n":
      return "https://img.icons8.com/emoji/96/sun-behind-small-cloud.png";
    case "03d":
    case "03n":
      return "https://img.icons8.com/emoji/96/cloud-emoji.png";
    case "04d":
    case "04n":
      return "https://img.icons8.com/emoji/96/cloud-emoji.png";
    case "09d":
    case "09n":
    case "10d":
    case "10n":
      return "https://img.icons8.com/emoji/96/cloud-with-rain-emoji.png";
    case "11d":
    case "11n":
      return "https://img.icons8.com/emoji/96/cloud-with-lightning-and-rain.png";
    case "13d":
    case "13n":
      return "https://img.icons8.com/emoji/96/cloud-with-snow-emoji.png";
    case "50d":
    case "50n":
      return "https://img.icons8.com/emoji/96/fog-emoji.png";
    default:
      return "https://img.icons8.com/emoji/96/sun-behind-cloud.png"; // fallback
  }
}

export default function Weather() {
  const [weatherData, setWeatherData] = useState({
    ready: false,
    forecast: [],
  });
  const [city, setCity] = useState("New York");
  const [unit, setUnit] = useState("celsius"); // "celsius" | "fahrenheit"
  const [darkMode, setDarkMode] = useState(false);

  const apiKey = "ab8e7ef210556986d1c9a75d6007b825";
  const presetCities = ["Lisbon", "Paris", "Sydney", "San Francisco"];

  // ---------- temperature helpers ----------

  function formatTemp(value) {
    if (unit === "celsius") return Math.round(value);
    return Math.round((value * 9) / 5 + 32);
  }

  const unitLabel = unit === "celsius" ? "°C" : "°F";

  // ---------- API handlers ----------

  function handleCurrentResponse(response) {
    const data = response.data;

    setWeatherData((prev) => ({
      ...prev,
      ready: true,
      city: data.name,
      country: data.sys.country,
      timezoneOffset: data.timezone,
      date: formatLocalDate(data.dt, data.timezone),
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed),
      iconCode: data.weather[0].icon,
      lat: data.coord.lat,
      lon: data.coord.lon,
    }));

    getForecast(data.coord.lat, data.coord.lon);
  }

  // use /data/2.5/forecast //
  function handleForecastResponse(response) {
    const timezoneOffset = response.data.city.timezone || 0;

    const grouped = {};

    response.data.list.forEach((item) => {
      const date = new Date(
        (item.dt + timezoneOffset) * 1000
      ); /* shift to local */
      const dateKey = date.toISOString().slice(0, 10); // YYYY-MM-DD

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          dt: item.dt,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          icon: item.weather[0].icon,
          score: Math.abs(date.getUTCHours() - 12), // for midday
          description: item.weather[0].description,
        };
      } else {
        grouped[dateKey].tempMin = Math.min(
          grouped[dateKey].tempMin,
          item.main.temp_min
        );
        grouped[dateKey].tempMax = Math.max(
          grouped[dateKey].tempMax,
          item.main.temp_max
        );

        const score = Math.abs(date.getUTCHours() - 12);
        if (score < grouped[dateKey].score) {
          grouped[dateKey].score = score;
          grouped[dateKey].icon = item.weather[0].icon;
          grouped[dateKey].description = item.weather[0].description;
          grouped[dateKey].dt = item.dt;
        }
      }
    });

    const sortedKeys = Object.keys(grouped).sort();
    // skip "today", show next 5 days//
    const nextDays = sortedKeys.slice(1, 6);

    const daily = nextDays.map((key) => {
      const d = grouped[key];
      return {
        dt: d.dt,
        tempMin: d.tempMin,
        tempMax: d.tempMax,
        icon: d.icon,
        description: d.description,
      };
    });

    setWeatherData((prev) => ({
      ...prev,
      forecast: daily,
      forecastTimezone: timezoneOffset,
    }));
  }

  function getForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    axios.get(url).then(handleForecastResponse);
  }

  function search(searchCity) {
    const query = searchCity || city;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric`;
    axios.get(url).then(handleCurrentResponse);
  }

  function searchByLocation(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    axios.get(url).then(handleCurrentResponse);
  }

  // ---------- event handlers ----------

  function handleSubmit(event) {
    event.preventDefault();
    search();
  }

  function handleCityChange(event) {
    setCity(event.target.value);
  }

  function handlePresetCityClick(event, preset) {
    event.preventDefault();
    setCity(preset);
    search(preset);
  }

  function handleCurrentLocation(event) {
    event.preventDefault();
    if (!navigator.geolocation) {
      alert("Geolocation is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        searchByLocation(position.coords.latitude, position.coords.longitude);
      },
      () => {
        alert("Unable to get your location.");
      }
    );
  }

  function showCelsius(event) {
    event.preventDefault();
    setUnit("celsius");
  }

  function showFahrenheit(event) {
    event.preventDefault();
    setUnit("fahrenheit");
  }

  function toggleTheme() {
    setDarkMode((prev) => !prev);
  }

  // ---------- initial load ----------

  if (!weatherData.ready) {
    search();
    return "Loading...";
  }

  // ---------- JSX ----------

  return (
    <div className="Weather">
      <div className={`weather-app ${darkMode ? "dark" : ""}`}>
        {/* Top preset cities + dark mode */}
        <div className="d-flex justify-content-between align-items-center mb-2 top-bar">
          <div className="city-links">
            {presetCities.map((preset) => (
              <a
                href="/"
                key={preset}
                onClick={(e) => handlePresetCityClick(e, preset)}
              >
                {preset}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary theme-toggle"
            onClick={toggleTheme}
          >
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>

        {/* Search + Current */}
        <form onSubmit={handleSubmit}>
          <div className="row g-2">
            <div className="col-7">
              <input
                type="search"
                placeholder="Enter a city..."
                className="form-control"
                autoFocus={true}
                onChange={handleCityChange}
              />
            </div>
            <div className="col-3">
              <input
                type="submit"
                value="Search"
                className="btn btn-primary w-100"
              />
            </div>
            <div className="col-2">
              <button
                type="button"
                className="btn btn-success w-100 btn-current"
                onClick={handleCurrentLocation}
              >
                Current
              </button>
            </div>
          </div>
        </form>

        {/* Current weather card */}
        <div className="weather-card">
          <h1>
            <span className="flag">{countryFlag(weatherData.country)}</span>
            {weatherData.city}
            {weatherData.country ? `, ${weatherData.country}` : ""}
          </h1>

          <div className="text-muted">
            {weatherData.date}, {weatherData.description}
          </div>
          <div className="text-muted mb-2">
            Humidity: {weatherData.humidity}% • Wind: {weatherData.wind} km/h
          </div>

          <div className="row align-items-center mt-2">
            <div className="col-6 temperature-wrapper">
              <img
                src={emojiIcon(weatherData.iconCode)}
                alt={weatherData.description}
                className="main-icon"
              />

              <div className="temp-and-units">
                <span className="temperature">
                  {formatTemp(weatherData.temperature)}
                </span>
                <span className="unit-toggle">
                  <a
                    href="/"
                    onClick={showCelsius}
                    className={unit === "celsius" ? "active" : ""}
                  >
                    °C
                  </a>
                  <span> | </span>
                  <a
                    href="/"
                    onClick={showFahrenheit}
                    className={unit === "fahrenheit" ? "active" : ""}
                  >
                    °F
                  </a>
                </span>
              </div>
            </div>

            <div className="col-6">
              <ul className="details-list">
                <li>
                  Feels like: {formatTemp(weatherData.feelsLike)}
                  {unitLabel}
                </li>
                <li>Humidity: {weatherData.humidity}%</li>
                <li>Wind: {weatherData.wind} km/h</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 5-day forecast */}
        <div className="Forecast mt-3">
          <div className="row">
            {weatherData.forecast.map((day, index) => {
              const dayName = formatDay(
                day.dt,
                weatherData.forecastTimezone || 0
              );
              return (
                <div className="col forecast-col" key={index}>
                  <div className="forecast-day">{dayName}</div>
                  <img
                    src={emojiIcon(day.icon)}
                    alt={day.description}
                    className="forecast-icon"
                  />
                  <div className="forecast-temps">
                    <span className="forecast-max">
                      {formatTemp(day.tempMax)}°
                    </span>{" "}
                    <span className="forecast-min">
                      {formatTemp(day.tempMin)}°
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
