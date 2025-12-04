import React from "react";
import Weather from "./Weather";

import "./App.css";

export default function App() {
  return (
    <div className="App">
      <div className="container">
        <h1>Weather App</h1>
        <Weather />
        <footer>
          This project was coded by{" "}
          <a
            href="https://www.shecodes.io/..."
            target="_blank"
            rel="noreferrer"
          >
            Tshilidzi Mulibana
          </a>{" "}
          and is open-sourced on{" "}
          <a href="https://github.com/..." target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          and hosted on{" "}
          <a
            href="https://chichis-weather.netlify.app"
            target="_blank"
            rel="noreferrer"
          >
            Netlify
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
