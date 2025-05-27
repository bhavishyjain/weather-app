// WeatherVibe Dashboard - Enhanced JavaScript
const API_KEY = "385dbe7a089564bd0c7804cfd00f8a9d";
const API_BASE = "https://api.openweathermap.org/data/2.5/";
const GEOCODING_API = "https://api.openweathermap.org/geo/1.0/";

// DOM Elements
const locationInput = document.getElementById("location-input");
const searchSuggestions = document.getElementById("search-suggestions");
const voiceBtn = document.getElementById("voice-btn");
const currentLocationBtn = document.getElementById("current-location-btn");
const locationBtns = document.querySelectorAll(".location-btn");
const tempUnits = document.querySelectorAll(".temp-unit");
const loadingOverlay = document.getElementById("loading-overlay");
const toastNotification = document.getElementById("toast-notification");

// Weather display elements
const currentLocationText = document.getElementById("current-location-text");
const liveTime = document.getElementById("live-time");
const mainWeatherIcon = document.getElementById("main-weather-icon");
const mainTemperature = document.getElementById("main-temperature");
const locationName = document.getElementById("location-name");
const weatherDescription = document.getElementById("weather-description");
const feelsLikeTemp = document.getElementById("feels-like-temp");
const visibility = document.getElementById("visibility");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");

// Additional weather elements
const aqiValue = document.getElementById("aqi-value");
const aqiStatus = document.getElementById("aqi-status");
const aqiFill = document.getElementById("aqi-fill");
const uvValue = document.getElementById("uv-value");
const uvLabel = document.getElementById("uv-label");
const uvFill = document.getElementById("uv-fill");
const pressureValue = document.getElementById("pressure-value");
const pressureNeedle = document.getElementById("pressure-needle");
const pressureTrend = document.getElementById("pressure-trend");
const sunriseTime = document.getElementById("sunrise-time");
const sunsetTime = document.getElementById("sunset-time");

// Forecast containers
const hourlyContainer = document.getElementById("hourly-container");
const weeklyContainer = document.getElementById("weekly-container");

// State variables
let currentUnit = "metric";
let currentWeatherData = null;
let searchTimeout = null;
let currentLocationCoords = null;

// Weather icon mapping
const weatherIcons = {
  "01d": "fas fa-sun", // clear sky day
  "01n": "fas fa-moon", // clear sky night
  "02d": "fas fa-cloud-sun", // few clouds day
  "02n": "fas fa-cloud-moon", // few clouds night
  "03d": "fas fa-cloud", // scattered clouds
  "03n": "fas fa-cloud",
  "04d": "fas fa-cloud", // broken clouds
  "04n": "fas fa-cloud",
  "09d": "fas fa-cloud-rain", // shower rain
  "09n": "fas fa-cloud-rain",
  "10d": "fas fa-cloud-sun-rain", // rain day
  "10n": "fas fa-cloud-moon-rain", // rain night
  "11d": "fas fa-bolt", // thunderstorm
  "11n": "fas fa-bolt",
  "13d": "far fa-snowflake", // snow
  "13n": "far fa-snowflake",
  "50d": "fas fa-smog", // mist
  "50n": "fas fa-smog",
};

// Weather condition icons (fallback)
const conditionIcons = {
  Clear: "fas fa-sun",
  Clouds: "fas fa-cloud",
  Rain: "fas fa-cloud-rain",
  Drizzle: "fas fa-cloud-sun-rain",
  Thunderstorm: "fas fa-bolt",
  Snow: "far fa-snowflake",
  Mist: "fas fa-smog",
  Fog: "fas fa-smog",
  Haze: "fas fa-smog",
  Smoke: "fas fa-smog",
  Dust: "fas fa-smog",
  Sand: "fas fa-smog",
  Ash: "fas fa-smog",
  Squall: "fas fa-wind",
  Tornado: "fas fa-wind",
};

// Initialize application
function init() {
  setupEventListeners();
  startLiveClock();
  createStars();
  getCurrentLocation();
}

// Event listeners setup
function setupEventListeners() {
  // Search functionality
  locationInput.addEventListener("input", handleSearchInput);
  locationInput.addEventListener("keypress", handleSearchKeypress);
  locationInput.addEventListener("focus", () => locationInput.select());

  // Voice search
  voiceBtn.addEventListener("click", handleVoiceSearch);

  // Current location
  currentLocationBtn.addEventListener("click", getCurrentLocation);

  // Quick location buttons
  locationBtns.forEach((btn) => {
    if (!btn.classList.contains("current-location-btn")) {
      btn.addEventListener("click", () => {
        const city = btn.dataset.city;
        searchWeather(city);
      });
    }
  });

  // Close toast notification
  const toastClose = document.querySelector(".toast-close");
  if (toastClose) {
    toastClose.addEventListener("click", hideToast);
  }

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      locationInput.focus();
    }
  });

  // Click outside to close suggestions
  document.addEventListener("click", (e) => {
    if (
      !locationInput.contains(e.target) &&
      !searchSuggestions.contains(e.target)
    ) {
      hideSuggestions();
    }
  });
}

// Search input handler with debouncing
function handleSearchInput(e) {
  const query = e.target.value.trim();

  clearTimeout(searchTimeout);

  if (query.length >= 2) {
    searchTimeout = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  } else {
    hideSuggestions();
  }
}

// Handle search on Enter key
function handleSearchKeypress(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const query = locationInput.value.trim();
    if (query) {
      searchWeather(query);
      hideSuggestions();
    }
  }
}

// Fetch location suggestions
async function fetchSuggestions(query) {
  try {
    const response = await fetch(
      `${GEOCODING_API}direct?q=${encodeURIComponent(
        query
      )}&limit=5&appid=${API_KEY}`
    );
    const data = await response.json();
    displaySuggestions(data);
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    hideSuggestions();
  }
}

// Display search suggestions
function displaySuggestions(suggestions) {
  searchSuggestions.innerHTML = "";

  if (suggestions.length === 0) {
    hideSuggestions();
    return;
  }

  suggestions.forEach((suggestion) => {
    const suggestionItem = document.createElement("div");
    suggestionItem.className = "suggestion-item";
    suggestionItem.innerHTML = `
      <i class="fas fa-map-marker-alt"></i>
      <span class="suggestion-name">${suggestion.name}</span>
      <span class="suggestion-country">${suggestion.country}</span>
      ${
        suggestion.state
          ? `<span class="suggestion-state">, ${suggestion.state}</span>`
          : ""
      }
    `;

    suggestionItem.addEventListener("click", () => {
      locationInput.value = `${suggestion.name}, ${suggestion.country}`;
      searchWeatherByCoords(suggestion.lat, suggestion.lon, suggestion.name);
      hideSuggestions();
    });

    searchSuggestions.appendChild(suggestionItem);
  });

  searchSuggestions.style.display = "block";
}

// Hide suggestions
function hideSuggestions() {
  searchSuggestions.style.display = "none";
}

// Voice search functionality
function handleVoiceSearch() {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    showToast("Voice search is not supported in your browser", "error");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  voiceBtn.innerHTML = '<i class="fas fa-circle" style="color: #ef4444;"></i>';
  voiceBtn.disabled = true;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    locationInput.value = transcript;
    searchWeather(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    showToast("Voice search failed. Please try again.", "error");
  };

  recognition.onend = () => {
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.disabled = false;
  };

  recognition.start();
}

// Get current location
function getCurrentLocation() {
  if (!navigator.geolocation) {
    showToast("Geolocation is not supported by this browser", "error");
    return;
  }

  showLoading();
  currentLocationText.textContent = "Getting location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      currentLocationCoords = { lat: latitude, lon: longitude };
      searchWeatherByCoords(latitude, longitude);
    },
    (error) => {
      console.error("Geolocation error:", error);
      hideLoading();
      let errorMessage = "Unable to get your location";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access denied by user";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }

      showToast(errorMessage, "error");
      currentLocationText.textContent = "Location unavailable";
      // Fallback to default city
      searchWeather("Mumbai");
    },
    {
      timeout: 10000,
      enableHighAccuracy: true,
      maximumAge: 300000,
    }
  );
}

// Search weather by city name
async function searchWeather(cityName) {
  showLoading();

  try {
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(
        `${API_BASE}weather?q=${encodeURIComponent(
          cityName
        )}&units=${currentUnit}&appid=${API_KEY}`
      ),
      fetch(
        `${API_BASE}forecast?q=${encodeURIComponent(
          cityName
        )}&units=${currentUnit}&appid=${API_KEY}`
      ),
    ]);

    if (!weatherResponse.ok || !forecastResponse.ok) {
      throw new Error("City not found");
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    currentWeatherData = weatherData;
    displayWeatherData(weatherData);
    displayForecastData(forecastData);

    // Fetch additional data
    fetchAirQuality(weatherData.coord.lat, weatherData.coord.lon);

    locationInput.value = "";
    showToast(`Weather updated for ${weatherData.name}`, "success");
  } catch (error) {
    console.error("Weather search error:", error);
    showToast(
      "City not found. Please check the spelling and try again.",
      "error"
    );
  } finally {
    hideLoading();
  }
}

// Search weather by coordinates
async function searchWeatherByCoords(lat, lon, cityName = null) {
  showLoading();

  try {
    const [weatherResponse, forecastResponse] = await Promise.all([
      fetch(
        `${API_BASE}weather?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
      ),
      fetch(
        `${API_BASE}forecast?lat=${lat}&lon=${lon}&units=${currentUnit}&appid=${API_KEY}`
      ),
    ]);

    if (!weatherResponse.ok || !forecastResponse.ok) {
      throw new Error("Location not found");
    }

    const weatherData = await weatherResponse.json();
    const forecastData = await forecastResponse.json();

    currentWeatherData = weatherData;
    displayWeatherData(weatherData);
    displayForecastData(forecastData);

    // Update location display
    if (currentLocationCoords && lat === currentLocationCoords.lat) {
      currentLocationText.innerHTML = `<i class="fas fa-crosshairs"></i> ${weatherData.name}, ${weatherData.sys.country}`;
    }

    // Fetch additional data
    fetchAirQuality(lat, lon);

    locationInput.value = "";
    showToast(`Weather updated for ${cityName || weatherData.name}`, "success");
  } catch (error) {
    console.error("Weather search error:", error);
    showToast("Unable to fetch weather data for this location", "error");
  } finally {
    hideLoading();
  }
}

// Display current weather data
function displayWeatherData(data) {
  const tempUnit = currentUnit === "metric" ? "°C" : "°F";
  const speedUnit = currentUnit === "metric" ? "km/h" : "mph";
  const speedMultiplier = currentUnit === "metric" ? 3.6 : 2.237;

  // Update main weather info
  locationName.textContent = `${data.name}, ${data.sys.country}`;
  mainTemperature.textContent = `${Math.round(data.main.temp)}° C`;
  weatherDescription.textContent = capitalizeWords(data.weather[0].description);
  feelsLikeTemp.textContent = `${Math.round(data.main.feels_like)}${tempUnit}`;

  // Update weather icon
  const iconCode = data.weather[0].icon;
  const iconClass =
    weatherIcons[iconCode] ||
    conditionIcons[data.weather[0].main] ||
    "fas fa-sun";
  mainWeatherIcon.innerHTML = `<i class="${iconClass}"></i>`;

  // Update metrics
  visibility.textContent = `${Math.round(
    (data.visibility || 10000) / 1000
  )} km`;
  humidity.textContent = `${data.main.humidity}%`;
  windSpeed.textContent = `${Math.round(
    (data.wind?.speed || 0) * speedMultiplier
  )} ${speedUnit}`;

  // Update pressure
  const pressure = data.main.pressure;
  pressureValue.textContent = `${pressure} hPa`;
  updatePressureGauge(pressure);

  // Update UV index (simulated based on weather conditions)
  const uvIndex = calculateUVIndex(data.weather[0].main, data.weather[0].icon);
  updateUVDisplay(uvIndex);

  // Update sunrise/sunset
  const sunrise = new Date(data.sys.sunrise * 1000);
  const sunset = new Date(data.sys.sunset * 1000);
  sunriseTime.textContent = formatTime(sunrise);
  sunsetTime.textContent = formatTime(sunset);

  // Update background based on weather
  updateBackground(data.weather[0].main, data.weather[0].icon);
}

// Display forecast data
function displayForecastData(data) {
  displayHourlyForecast(data.list.slice(0, 24));
  displayWeeklyForecast(data.list);
}

// Display hourly forecast
function displayHourlyForecast(hourlyData) {
  hourlyContainer.innerHTML = "";

  hourlyData.forEach((hour, index) => {
    const date = new Date(hour.dt * 1000);
    const temp = Math.round(hour.main.temp);
    const iconCode = hour.weather[0].icon;
    const iconClass =
      weatherIcons[iconCode] ||
      conditionIcons[hour.weather[0].main] ||
      "fas fa-sun";

    const timeLabel = index === 0 ? "Now" : formatTime(date, true);

    const hourlyItem = document.createElement("div");
    hourlyItem.className = "hourly-item";
    hourlyItem.innerHTML = `
      <div class="hourly-time">${timeLabel}</div>
      <div class="hourly-icon"><i class="${iconClass}"></i></div>
      <div class="hourly-temp">${temp}°</div>
      <div class="hourly-desc">${hour.weather[0].main}</div>
    `;

    hourlyContainer.appendChild(hourlyItem);
  });
}

// Display weekly forecast
function displayWeeklyForecast(forecastData) {
  weeklyContainer.innerHTML = "";

  // Group data by day
  const dailyData = {};
  forecastData.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayKey = date.toDateString();

    if (!dailyData[dayKey]) {
      dailyData[dayKey] = {
        date: date,
        temps: [],
        conditions: [],
        items: [],
      };
    }

    dailyData[dayKey].temps.push(item.main.temp);
    dailyData[dayKey].conditions.push(item.weather[0]);
    dailyData[dayKey].items.push(item);
  });

  const days = Object.values(dailyData).slice(0, 7);

  days.forEach((day, index) => {
    const maxTemp = Math.round(Math.max(...day.temps));
    const minTemp = Math.round(Math.min(...day.temps));

    // Get most common weather condition
    const conditionCounts = {};
    day.conditions.forEach((condition) => {
      const key = condition.main;
      conditionCounts[key] = (conditionCounts[key] || 0) + 1;
    });

    const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
      conditionCounts[a] > conditionCounts[b] ? a : b
    );

    const iconClass = conditionIcons[dominantCondition] || "fas fa-sun";
    const dayName =
      index === 0
        ? "Today"
        : day.date.toLocaleDateString("en-US", { weekday: "short" });

    const weeklyItem = document.createElement("div");
    weeklyItem.className = "weekly-item";
    weeklyItem.innerHTML = `
      <div class="weekly-day">${dayName}</div>
      <div class="weekly-icon"><i class="${iconClass}"></i></div>
      <div class="weekly-condition">${dominantCondition}</div>
      <div class="weekly-temps">
        <span class="weekly-high">${maxTemp}°</span>
        <span class="weekly-low">${minTemp}°</span>
      </div>
    `;

    weeklyContainer.appendChild(weeklyItem);
  });
}

// Fetch air quality data
async function fetchAirQuality(lat, lon) {
  try {
    const response = await fetch(
      `${API_BASE}air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
    );
    const data = await response.json();

    if (data.list && data.list.length > 0) {
      const aqi = data.list[0].main.aqi;
      updateAirQuality(aqi);
    }
  } catch (error) {
    console.error("Air quality fetch error:", error);
    // Set default values
    updateAirQuality(2);
  }
}

// Update air quality display
function updateAirQuality(aqi) {
  const aqiLabels = ["", "Good", "Fair", "Moderate", "Poor", "Very Poor"];
  const aqiColors = ["", "#00e400", "#ffff00", "#ff7e00", "#ff0000", "#8f3f97"];

  aqiValue.textContent = aqi * 20; // Convert to 0-100 scale
  aqiStatus.textContent = aqiLabels[aqi] || "Unknown";
  aqiFill.style.width = `${aqi * 20}%`;
  aqiFill.style.backgroundColor = aqiColors[aqi] || "#ccc";
}

// Calculate UV index (simulated)
function calculateUVIndex(weatherMain, iconCode) {
  const hour = new Date().getHours();
  const isNight = iconCode.includes("n") || hour < 6 || hour > 18;

  if (isNight) return 0;

  let baseUV = 5; // Default moderate UV

  // Adjust based on weather conditions
  switch (weatherMain) {
    case "Clear":
      baseUV = 8;
      break;
    case "Clouds":
      baseUV = 4;
      break;
    case "Rain":
    case "Drizzle":
    case "Thunderstorm":
      baseUV = 2;
      break;
    case "Snow":
      baseUV = 6; // Snow can reflect UV
      break;
  }

  // Adjust for time of day
  if (hour < 10 || hour > 16) {
    baseUV *= 0.5;
  }

  return Math.max(0, Math.min(11, Math.round(baseUV)));
}

// Update UV index display
function updateUVDisplay(uvIndex) {
  const uvLabels = [
    "Low",
    "Low",
    "Low",
    "Moderate",
    "Moderate",
    "Moderate",
    "High",
    "High",
    "Very High",
    "Very High",
    "Extreme",
    "Extreme",
  ];
  const uvColors = [
    "#289500",
    "#289500",
    "#289500",
    "#f7931e",
    "#f7931e",
    "#f7931e",
    "#c53929",
    "#c53929",
    "#d1242f",
    "#d1242f",
    "#6b49c8",
    "#6b49c8",
  ];

  uvValue.textContent = uvIndex;
  uvLabel.textContent = uvLabels[uvIndex] || "Low";

  const percentage = (uvIndex / 11) * 100;
  uvFill.style.strokeDasharray = `${percentage}, 100`;
  uvFill.style.stroke = uvColors[uvIndex] || "#289500";
}

// Update pressure gauge
function updatePressureGauge(pressure) {
  // Normal pressure range: 980-1040 hPa
  const minPressure = 980;
  const maxPressure = 1040;
  const normalizedPressure = Math.max(
    0,
    Math.min(1, (pressure - minPressure) / (maxPressure - minPressure))
  );

  // Rotate needle (-90° to +90°)
  const rotation = normalizedPressure * 180 - 90;
  pressureNeedle.style.transform = `rotate(${rotation}deg)`;

  // Update trend (simplified)
  const trendIcon =
    pressure > 1013
      ? "fas fa-arrow-up"
      : pressure < 1000
      ? "fas fa-arrow-down"
      : "fas fa-minus";
  const trendText =
    pressure > 1013 ? "Rising" : pressure < 1000 ? "Falling" : "Stable";
  pressureTrend.innerHTML = `<i class="${trendIcon}"></i> ${trendText}`;
}

// Convert and update temperature when unit changes
function convertAndUpdateTemperature() {
  if (!currentWeatherData) return;

  showLoading();

  // Re-fetch data with new unit
  if (
    currentLocationCoords &&
    currentWeatherData.coord.lat === currentLocationCoords.lat &&
    currentWeatherData.coord.lon === currentLocationCoords.lon
  ) {
    searchWeatherByCoords(currentLocationCoords.lat, currentLocationCoords.lon);
  } else {
    searchWeather(currentWeatherData.name);
  }
}

// Update background based on weather
function updateBackground(weatherMain, iconCode) {
  const isNight = iconCode.includes("n");
  const body = document.body;

  // Remove existing weather classes
  body.className = body.className.replace(/weather-\w+/g, "");

  // Add weather class
  const weatherClass = `weather-${weatherMain.toLowerCase()}${
    isNight ? "-night" : ""
  }`;
  body.classList.add(weatherClass);
}

// Create animated stars
function createStars() {
  const starsContainer = document.querySelector(".stars-container");
  if (!starsContainer) return;

  for (let i = 0; i < 100; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 3 + "s";
    star.style.animationDuration = Math.random() * 2 + 1 + "s";
    starsContainer.appendChild(star);
  }
}

// Live clock
function startLiveClock() {
  function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
    const dateString = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    if (liveTime) {
      liveTime.innerHTML = `
        <div class="time">${timeString}</div>
        <div class="date">${dateString}</div>
      `;
    }
  }

  updateTime();
  setInterval(updateTime, 1000);
}

// Utility functions
function capitalizeWords(str) {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatTime(date, shortFormat = false) {
  const options = shortFormat
    ? { hour: "numeric", hour12: true }
    : { hour: "numeric", minute: "2-digit", hour12: true };
  return date.toLocaleTimeString("en-US", options);
}

function showLoading() {
  loadingOverlay.style.display = "flex";
}

function hideLoading() {
  loadingOverlay.style.display = "none";
}

function showToast(message, type = "info") {
  const toast = toastNotification;
  const icon = toast.querySelector(".toast-icon");
  const messageEl = toast.querySelector(".toast-message");

  // Set icon based on type
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    info: "fas fa-info-circle",
    warning: "fas fa-exclamation-triangle",
  };

  icon.innerHTML = `<i class="${icons[type]}"></i>`;
  messageEl.textContent = message;

  // Set color based on type
  toast.className = `toast-notification toast-${type}`;
  toast.style.display = "flex";

  // Auto-hide after 5 seconds
  setTimeout(hideToast, 5000);
}

function hideToast() {
  toastNotification.style.display = "none";
}

// Initialize the application
document.addEventListener("DOMContentLoaded", init);

// Handle window resize
window.addEventListener("resize", () => {
  // Recreate stars on resize
  const starsContainer = document.querySelector(".stars-container");
  if (starsContainer) {
    starsContainer.innerHTML = "";
    createStars();
  }
});

// Service Worker registration (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("SW registered:", registration))
      .catch((error) => console.log("SW registration failed:", error));
  });
}
