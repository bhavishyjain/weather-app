const API_KEY = "385dbe7a089564bd0c7804cfd00f8a9d";
const API_BASE = "https://api.openweathermap.org/data/2.5/";

// DOM Elements
const searchInput = document.querySelector(".search-input");
const searchBtn = document.querySelector(".search-btn");
const loadingScreen = document.querySelector(".loading-screen");
const errorMessage = document.querySelector(".error-message");
const unitToggle = document.querySelectorAll(".toggle-btn");
const dynamicBg = document.querySelector(".dynamic-bg");

// State variables
let currentUnit = "metric";
let currentCity = "Mumbai";

// Enhanced weather icon mapping with Font Awesome icons
const weatherIcons = {
  Clear: '<i class="fas fa-sun"></i>',
  Clouds: '<i class="fas fa-cloud"></i>',
  Rain: '<i class="fas fa-cloud-rain"></i>',
  Drizzle: '<i class="fas fa-cloud-sun-rain"></i>',
  Thunderstorm: '<i class="fas fa-bolt"></i>',
  Snow: '<i class="far fa-snowflake"></i>',
  Mist: '<i class="fas fa-smog"></i>',
  Fog: '<i class="fas fa-smog"></i>',
  Haze: '<i class="fas fa-smog"></i>',
  Smoke: '<i class="fas fa-smog"></i>',
  Dust: '<i class="fas fa-smog"></i>',
  Sand: '<i class="fas fa-smog"></i>',
  Ash: '<i class="fas fa-smog"></i>',
  Squall: '<i class="fas fa-wind"></i>',
  Tornado: '<i class="fas fa-wind"></i>',
};

// Weather-based background gradients
const weatherBackgrounds = {
  Clear:
    "radial-gradient(circle at 30% 40%, #fbbf24 0%, #f59e0b 25%, #d97706 50%), linear-gradient(135deg, #0c1446 0%, #4b6cb7 100%)",
  Clouds:
    "radial-gradient(circle at 20% 30%, #6b7280 0%, #4b5563 30%, #374151 60%), linear-gradient(135deg, #3a4a6b 0%, #939aa9 100%)",
  Rain: "radial-gradient(circle at 40% 60%, #1e40af 0%, #1e3a8a 40%, #1e293b 70%), linear-gradient(135deg, #1a2a6c 0%, #4b79cf 100%)",
  Drizzle:
    "radial-gradient(circle at 50% 50%, #0ea5e9 0%, #0284c7 40%, #0369a1 70%), linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
  Thunderstorm:
    "radial-gradient(circle at 30% 70%, #7c3aed 0%, #6d28d9 30%, #5b21b6 60%), linear-gradient(135deg, #0f0c29 0%, #302b63 100%)",
  Snow: "radial-gradient(circle at 60% 30%, #e0e7ff 0%, #c7d2fe 30%, #a5b4fc 60%), linear-gradient(135deg, #1c92d2 0%, #a6c1ee 100%)",
  Mist: "radial-gradient(circle at 40% 50%, #9ca3af 0%, #6b7280 40%, #4b5563 70%), linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
  Fog: "radial-gradient(circle at 40% 50%, #9ca3af 0%, #6b7280 40%, #4b5563 70%), linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)",
  Haze: "radial-gradient(circle at 35% 45%, #a1a1aa 0%, #71717a 40%, #52525b 70%), linear-gradient(135deg, #71717a 0%, #52525b 100%)",
  default:
    "radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 50%, #020617 100%), linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)",
};

// Create floating particles animation
function createParticles() {
  const particlesContainer = document.getElementById("particles");
  particlesContainer.innerHTML = ""; // Clear existing particles

  const particleCount = window.innerWidth > 768 ? 50 : 25; // Fewer on mobile

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDelay = Math.random() * 20 + "s";
    particle.style.animationDuration = Math.random() * 10 + 15 + "s";
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    particle.style.width = Math.random() * 3 + 1 + "px";
    particle.style.height = particle.style.width;
    particlesContainer.appendChild(particle);
  }
}

// Set dynamic background based on weather and time
function setDynamicBackground(weatherType, isNight = false) {
  const hour = new Date().getHours();
  const actualIsNight = isNight || hour < 6 || hour >= 19;

  let gradient = weatherBackgrounds[weatherType] || weatherBackgrounds.default;

  // Adjust for night time with darker overlay
  if (actualIsNight) {
    gradient = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), ${gradient}`;
  }

  dynamicBg.style.background = gradient;

  // Add smooth transition
  dynamicBg.style.transition = "background 1.5s ease-in-out";
}

// Enhanced error handling with retry mechanism
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
    }
  }
}

// Event listeners with improved UX
searchInput.addEventListener("keypress", handleSearch);
searchInput.addEventListener("input", debounce(handleInputChange, 300));
searchBtn.addEventListener("click", () => performSearch());

// Unit toggle with smooth transitions
unitToggle.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.classList.contains("active")) return; // Prevent unnecessary calls

    unitToggle.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentUnit = btn.dataset.unit;

    // Add loading state for unit conversion
    if (currentCity) {
      performSearch();
    }
  });
});

// Debounce function for search input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function handleInputChange() {
  const query = searchInput.value.trim();
  if (query.length > 2) {
    // Could implement autocomplete here
    hideError();
  }
}

function handleSearch(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    performSearch();
  }
}

async function performSearch() {
  const query = searchInput.value.trim() || currentCity;
  if (!query || query.length < 2) {
    showError("Please enter a valid city name");
    return;
  }

  currentCity = query;
  showLoading();
  hideError();

  try {
    const [weatherData, forecastData] = await Promise.all([
      fetchWithRetry(
        `${API_BASE}weather?q=${query}&units=${currentUnit}&appid=${API_KEY}`
      ),
      fetchWithRetry(
        `${API_BASE}forecast?q=${query}&units=${currentUnit}&appid=${API_KEY}`
      ),
    ]);

    // Check if location exists
    if (!weatherData || !forecastData) {
      throw new Error("Location not found");
    }

    await displayWeatherData(weatherData);
    displayForecastData(forecastData);

    // Set background based on weather and timezone
    const isNight = checkIfNight(weatherData.timezone);
    setDynamicBackground(weatherData.weather[0].main, isNight);

    // Clear search input on successful search
    searchInput.value = "";
  } catch (error) {
    console.error("Weather fetch error:", error);

    let errorMsg =
      "Unable to find weather data for this location. Please try again.";
    if (error.message.includes("404")) {
      errorMsg = "City not found. Please check the spelling and try again.";
    } else if (error.message.includes("429")) {
      errorMsg = "Too many requests. Please wait a moment and try again.";
    } else if (error.message.includes("401")) {
      errorMsg =
        "Weather service temporarily unavailable. Please try again later.";
    }

    showError(errorMsg);
  } finally {
    hideLoading();
  }
}

// Check if it's night time based on timezone
function checkIfNight(timezone) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const localTime = new Date(utc + timezone * 1000);
  const hour = localTime.getHours();
  return hour < 6 || hour >= 19;
}

async function displayWeatherData(data) {
  const tempUnit = currentUnit === "metric" ? "°C" : "°F";
  const speedUnit = currentUnit === "metric" ? "km/h" : "mph";
  const speedMultiplier = currentUnit === "metric" ? 3.6 : 2.237;

  // Update main weather info with smooth transitions
  updateElementWithTransition(
    ".city-name",
    `${data.name}, ${data.sys.country}`
  );
  updateElementWithTransition(
    ".date-time",
    formatDateTime(new Date(), data.timezone)
  );
  updateElementWithTransition(
    ".main-temp",
    `${Math.round(data.main.temp)}${tempUnit}`
  );
  updateElementWithTransition(
    ".weather-desc",
    capitalizeFirstLetter(data.weather[0].description)
  );

  // Update weather icon with animation
  const weatherType = data.weather[0].main;
  const iconElement = document.querySelector(".weather-icon");
  iconElement.style.transform = "scale(0)";

  setTimeout(() => {
    iconElement.innerHTML = weatherIcons[weatherType] || weatherIcons["Clear"];
    iconElement.style.transform = "scale(1)";
  }, 200);

  // Update detail cards with staggered animation
  const cardUpdates = [
    [".feels-like", `${Math.round(data.main.feels_like)}${tempUnit}`],
    [".humidity", `${data.main.humidity}%`],
    [
      ".wind-speed",
      `${Math.round((data.wind?.speed || 0) * speedMultiplier)} ${speedUnit}`,
    ],
    [".visibility", `${Math.round((data.visibility || 10000) / 1000)} km`],
    [".pressure", `${data.main.pressure} hPa`],
    [".uv-index", getUVLevel(data.main.temp, data.weather[0].main)],
  ];

  cardUpdates.forEach(([selector, value], index) => {
    setTimeout(() => {
      updateElementWithTransition(selector, value);
    }, index * 100);
  });

  // Add fade-in animation to cards
  setTimeout(() => {
    document.querySelector(".weather-grid").classList.add("fade-in");
    document.querySelector(".info-cards").classList.add("fade-in");
  }, 300);
}

function displayForecastData(data) {
  const tempUnit = currentUnit === "metric" ? "°" : "°";
  const forecastCards = document.querySelectorAll(".forecast-card");
  const dailyForecasts = {};

  // Group forecasts by day and get daily min/max
  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const day = date.toDateString();

    if (!dailyForecasts[day]) {
      dailyForecasts[day] = {
        temps: [],
        weather: item.weather[0],
        date: date,
        items: [],
      };
    }
    dailyForecasts[day].temps.push(item.main.temp);
    dailyForecasts[day].items.push(item);
  });

  const days = Object.keys(dailyForecasts).slice(0, 5);

  days.forEach((day, index) => {
    if (forecastCards[index]) {
      const forecast = dailyForecasts[day];
      const maxTemp = Math.round(Math.max(...forecast.temps));
      const minTemp = Math.round(Math.min(...forecast.temps));

      // Get the most common weather condition for the day
      const weatherCounts = {};
      forecast.items.forEach((item) => {
        const weather = item.weather[0].main;
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
      });
      const dominantWeather = Object.keys(weatherCounts).reduce((a, b) =>
        weatherCounts[a] > weatherCounts[b] ? a : b
      );

      const dayName = getDayName(index, forecast.date);

      // Animate forecast cards
      const card = forecastCards[index];
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";

      setTimeout(() => {
        card.querySelector(".forecast-day").textContent = dayName;
        card.querySelector(".forecast-icon").innerHTML =
          weatherIcons[dominantWeather] || weatherIcons["Clear"];
        card.querySelector(
          ".forecast-temp"
        ).textContent = `${maxTemp}${tempUnit}/${minTemp}${tempUnit}`;

        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
        card.style.transition = "all 0.3s ease";
      }, index * 100);
    }
  });

  setTimeout(() => {
    document.querySelector(".forecast-section").classList.add("fade-in");
  }, 500);
}

// Helper functions
function getDayName(index, date) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function updateElementWithTransition(selector, content) {
  const element = document.querySelector(selector);
  if (element) {
    element.style.opacity = "0.5";
    setTimeout(() => {
      element.textContent = content;
      element.style.opacity = "1";
      element.style.transition = "opacity 0.3s ease";
    }, 150);
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDateTime(date, timezone = 0) {
  // Adjust for timezone offset
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const localTime = new Date(utc + timezone * 1000);

  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return localTime.toLocaleDateString("en-US", options);
}

function getUVLevel(temp, weatherType) {
  // Enhanced UV calculation based on temperature and weather
  const tempInCelsius =
    currentUnit === "imperial" ? ((temp - 32) * 5) / 9 : temp;

  // Reduce UV for cloudy/rainy weather
  let uvMultiplier = 1;
  if (["Clouds", "Rain", "Drizzle", "Thunderstorm"].includes(weatherType)) {
    uvMultiplier = 0.5;
  } else if (["Mist", "Fog", "Haze"].includes(weatherType)) {
    uvMultiplier = 0.3;
  }

  const adjustedTemp = tempInCelsius * uvMultiplier;

  if (adjustedTemp > 30) return "Very High";
  if (adjustedTemp > 25) return "High";
  if (adjustedTemp > 20) return "Moderate";
  if (adjustedTemp > 15) return "Low";
  return "Very Low";
}

// Loading and error states
function showLoading() {
  loadingScreen.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function hideLoading() {
  loadingScreen.style.display = "none";
  document.body.style.overflow = "auto";
}

function showError(
  message = "Unable to find weather data for this location. Please try again."
) {
  const errorElement = document.querySelector(".error-message p");
  if (errorElement) {
    errorElement.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
  }
  errorMessage.style.display = "block";

  // Auto-hide error after 5 seconds
  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  errorMessage.style.display = "none";
}

// Get user's location
function getCurrentLocation() {
  if (navigator.geolocation) {
    showLoading();
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const weatherData = await fetchWithRetry(
            `${API_BASE}weather?lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${API_KEY}`
          );

          currentCity = weatherData.name;
          searchInput.placeholder = `Current location: ${weatherData.name}`;

          const forecastData = await fetchWithRetry(
            `${API_BASE}forecast?lat=${latitude}&lon=${longitude}&units=${currentUnit}&appid=${API_KEY}`
          );

          await displayWeatherData(weatherData);
          displayForecastData(forecastData);

          const isNight = checkIfNight(weatherData.timezone);
          setDynamicBackground(weatherData.weather[0].main, isNight);
        } catch (error) {
          console.error("Location weather fetch error:", error);
          // Fallback to default city
          currentCity = "Mumbai";
          performSearch();
        } finally {
          hideLoading();
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        hideLoading();
        // Continue with default city
        performSearch();
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 300000, // 5 minutes
      }
    );
  } else {
    // Geolocation not supported, use default
    performSearch();
  }
}

// Responsive particles on window resize
function handleResize() {
  createParticles();
}

// Initialize application
function initializeApp() {
  createParticles();

  // Try to get user's current location first
  getCurrentLocation();

  // Set up resize listener
  window.addEventListener("resize", debounce(handleResize, 250));

  // Add keyboard shortcut for search (Ctrl/Cmd + K)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Add click outside to close error
  document.addEventListener("click", (e) => {
    if (
      !errorMessage.contains(e.target) &&
      errorMessage.style.display === "block"
    ) {
      hideError();
    }
  });
}

// Start the application when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);

// Service worker registration for offline support (optional)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
