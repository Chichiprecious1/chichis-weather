import React, { useState } from "react";
import axios from "axios";
import "./Weather.css";

// Get the *current* local time in the city using the timezone offset
function formatLocalTime(timezoneOffset) {
  const cityTime = new Date(Date.now() + timezoneOffset * 1000);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = days[cityTime.getUTCDay()];

  let hours = cityTime.getUTCHours();
  if (hours < 10) {
    hours = `0${hours}`;
  }

  let minutes = cityTime.getUTCMinutes();
  if (minutes < 10) {
    minutes = `0${minutes}`;
  }

  return `${day} ${hours}:${minutes}`;
}

// Map OpenWeather icon codes to bright emoji-style icons
function emojiIcon(iconCode) {
  if (!iconCode) {
    return "https://img.icons8.com/emoji/1200/sun-behind-cloud.png";
  }

  if (iconCode.startsWith("01")) {
    // clear sky
    return "https://img.icons8.com/emoji/1200/sun-emoji.png";
  }
  if (iconCode.startsWith("02") || iconCode.startsWith("03")) {
    // few / scattered clouds
    return "https://img.icons8.com/emoji/1200/sun-behind-cloud.png";
  }
  if (iconCode.startsWith("04")) {
    // broken clouds
    return "https://img.icons8.com/emoji/1200/cloud-emoji.png";
  }
  if (iconCode.startsWith("09") || iconCode.startsWith("10")) {
    // rain
    return "https://img.icons8.com/emoji/1200/cloud-with-rain-emoji.png";
  }
  if (iconCode.startsWith("11")) {
    // storm
    return "https://img.icons8.com/emoji/1200/cloud-with-lightning-and-rain-emoji.png";
  }
  if (iconCode.startsWith("13")) {
    // snow
    return "https://img.icons8.com/emoji/1200/cloud-with-snow-emoji.png";
  }
  if (iconCode.startsWith("50")) {
    // mist / fog
    return "https://img.icons8.com/emoji/1200/fog-emoji.png";
  }

  return "https://img.icons8.com/emoji/1200/sun-behind-cloud.png";
}

// Decide which background theme to use based on Celsius temp
function temperatureTheme(tempC) {
  if (tempC <= 0) return "theme-freezing";
  if (tempC <= 10) return "theme-cold";
  if (tempC <= 20) return "theme-cool";
  if (tempC <= 30) return "theme-warm";
  return "theme-hot";
}

export default function Weather() {
  const [city, setCity] = useState("New York");
  const [unit, setUnit] = useState("celsius"); // "celsius" or "fahrenheit"
  const [weatherData, setWeatherData] = useState({ ready: false });
  const [forecast, setForecast] = useState([]);

  // CURRENT WEATHER
  function handleCurrentResponse(response) {
    let precipitation = "—";
    if (response.data.rain && response.data.rain["1h"] != null) {
      precipitation = `${response.data.rain["1h"]} mm`;
    } else if (response.data.snow && response.data.snow["1h"] != null) {
      precipitation = `${response.data.snow["1h"]} mm`;
    }

    setWeatherData({
      ready: true,
      city: response.data.name,
      temperature: response.data.main.temp,
      feelsLike: response.data.main.feels_like, // 👈 NEW
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      wind: response.data.wind.speed,
      date: formatLocalTime(response.data.timezone),
      iconCode: response.data.weather[0].icon,
      timezone: response.data.timezone,
    });
  }

  // 5-DAY FORECAST – real daily high/low
  function handleForecastResponse(response) {
    const grouped = {};

    response.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split("T")[0];

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          icon: item.weather[0].icon,
          description: item.weather[0].description,
          middayScore: Math.abs(date.getHours() - 12),
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

        const score = Math.abs(date.getHours() - 12);
        if (score < grouped[dateKey].middayScore) {
          grouped[dateKey].middayScore = score;
          grouped[dateKey].icon = item.weather[0].icon;
          grouped[dateKey].description = item.weather[0].description;
        }
      }
    });

    const daily = Object.keys(grouped)
      .sort()
      .slice(0, 5)
      .map((key) => {
        const day = grouped[key];
        return {
          day: day.day,
          tempMin: day.tempMin,
          tempMax: day.tempMax,
          icon: day.icon,
          description: day.description,
        };
      });

    setForecast(daily);
  }

  function search() {
    const apiKey = "ab8e7ef210556986d1c9a75d6007b825"; // your key
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    axios.get(currentUrl).then(handleCurrentResponse);
    axios.get(forecastUrl).then(handleForecastResponse);
  }

  function handleSubmit(event) {
    event.preventDefault();
    search();
  }

  function handleCityChange(event) {
    setCity(event.target.value);
  }

  function showCelsius(event) {
    event.preventDefault();
    setUnit("celsius");
  }

  function showFahrenheit(event) {
    event.preventDefault();
    setUnit("fahrenheit");
  }

  function convertTemp(tempC) {
    if (unit === "celsius") return Math.round(tempC);
    return Math.round((tempC * 9) / 5 + 32);
  }

  function unitLabel() {
    return unit === "celsius" ? "°C" : "°F";
  }

  if (!weatherData.ready) {
    search();
    return "Loading...";
  }

  const themeClass = temperatureTheme(weatherData.temperature);

  return (
    <div className={`Weather ${themeClass}`}>
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <div className="col-9">
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
        </div>
      </form>

      <div className="weather-card">
        <h1>{weatherData.city}</h1>
        <p className="text-muted">
          {weatherData.date}, {weatherData.description}
        </p>
        <p className="small">
          Humidity: <strong>{weatherData.humidity}%</strong>, Wind:{" "}
          <strong>{Math.round(weatherData.wind)} km/h</strong>
        </p>

        <div className="row align-items-center mb-3">
          <div className="col-6">
            <div className="temperature-wrapper">
              <img
                src={emojiIcon(weatherData.iconCode)}
                alt={weatherData.description}
                className="main-icon"
              />
              <div className="temp-and-units">
                <span className="temperature">
                  {convertTemp(weatherData.temperature)}
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
          </div>

          <div className="col-6"></div>
        </div>

        {/* 5-day forecast with TRUE daily high/low */}
        <div className="Forecast row text-center">
          {forecast.map((day, index) => (
            <div className="col forecast-col" key={index}>
              <div className="forecast-day">{day.day}</div>
              <img
                src={emojiIcon(day.icon)}
                alt={day.description}
                className="forecast-icon"
              />
              <div className="forecast-temps">
                <span className="forecast-max">
                  {convertTemp(day.tempMax)}
                  {unitLabel()}
                </span>
                <br />
                <span className="forecast-min">
                  {convertTemp(day.tempMin)}
                  {unitLabel()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
