import React from "react";

import "./App.css";

export default function App() {
  return (
    <div className="App">
      <h1>Weather App</h1>
      <div className="container">
        <footer>
          This project was coded by {""}
          <a
            href=" https://www.shecodes.io/graduates/92144-tshilidzi-mulibana"
            target="_blank"
          >
            Tshilidzi Mulibana
          </a>{" "}
          and is open-sourced on{" "}
          <a
            href="https://github.com/Chichiprecious1/chichis-weather/blob/main/src/App.js"
            target="_blank"
          >
            GitHub
          </a>{" "}
          and hosted on{" "}
          <a href="https://chichis-weather.netlify.app/" target="_blank">
            Netlify
          </a>
        </footer>
      </div>
    </div>
  );
}
