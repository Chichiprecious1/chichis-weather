import React, { useState } from "react";
import axios from "axios";
import "./Weather.css";

// Format date/time for the city's local timezone
function formatDate(timestamp, timezoneOffset) {
  const localTime = new Date((timestamp + timezoneOffset) * 1000);

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const day = days[localTime.getUTCDay()];

  let hours = localTime.getUTCHours();
  if (hours < 10) {
    hours = `0${hours}`;
  }

  let minutes = localTime.getUTCMinutes();
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

  // fallback
  return "https://img.icons8.com/emoji/1200/sun-behind-cloud.png";
}

export default function Weather() {
  const [city, setCity] = useState("New York");
  const [unit, setUnit] = useState("celsius"); // "celsius" or "fahrenheit"
  const [weatherData, setWeatherData] = useState({ ready: false });
  const [forecast, setForecast] = useState([]);

  // current weather response
  function handleCurrentResponse(response) {
    // precipitation from rain/snow if present; show "—" if nothing
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
      description: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      wind: response.data.wind.speed,
      date: formatDate(response.data.dt, response.data.timezone),
      precipitation: precipitation,
      iconCode: response.data.weather[0].icon,
    });
  }

  // 5-day forecast response
  function handleForecastResponse(response) {
    const daily = [];
    const usedDates = new Set();

    response.data.list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dateKey = date.toISOString().split("T")[0];

      if (!usedDates.has(dateKey) && daily.length < 5) {
        usedDates.add(dateKey);
        daily.push({
          day: dayName,
          tempMin: item.main.temp_min,
          tempMax: item.main.temp_max,
          icon: item.weather[0].icon,
          description: item.weather[0].description,
        });
      }
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

  // first load
  if (!weatherData.ready) {
    search();
    return "Loading...";
  }

  return (
    <div className="Weather">
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

          <div className="col-6">
            <ul className="list-unstyled small">
              <li>Precipitation: {weatherData.precipitation}</li>
              <li>Humidity: {weatherData.humidity}%</li>
              <li>Wind: {Math.round(weatherData.wind)} km/h</li>
            </ul>
          </div>
        </div>

        {/* Forecast row */}
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
