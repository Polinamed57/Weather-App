const weatherForm = document.querySelector("#weatherForm");
const cityInput = document.querySelector("#cityInput");
const submitButton = document.querySelector("#submitButton");
const card = document.querySelector("#card");
const message = document.querySelector("#message");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const favoritesList = document.querySelector("#favoritesList");
const clearFavoritesButton = document.querySelector("#clearFavoritesButton");
const forecastGrid = document.querySelector("#forecastGrid");
const hourlyGrid = document.querySelector("#hourlyGrid");
const themeToggle = document.querySelector("#themeToggle");
const locationButton = document.querySelector("#locationButton");
const unitButtons = document.querySelectorAll(".unit-button");

const cityDisplay = document.querySelector("#cityDisplay");
const descDisplay = document.querySelector("#descDisplay");
const weatherEmoji = document.querySelector("#weatherEmoji");
const tempDisplay = document.querySelector("#tempDisplay");
const feelsLikeDisplay = document.querySelector("#feelsLikeDisplay");
const humidityDisplay = document.querySelector("#humidityDisplay");
const windDisplay = document.querySelector("#windDisplay");
const pressureDisplay = document.querySelector("#pressureDisplay");
const minMaxDisplay = document.querySelector("#minMaxDisplay");
const visibilityDisplay = document.querySelector("#visibilityDisplay");
const unitDisplay = document.querySelector("#unitDisplay");
const sunriseDisplay = document.querySelector("#sunriseDisplay");
const sunsetDisplay = document.querySelector("#sunsetDisplay");
const lastUpdatedDisplay = document.querySelector("#lastUpdatedDisplay");
const locationMeta = document.querySelector("#locationMeta");
const favoriteToggle = document.querySelector("#favoriteToggle");
const rainLayer = document.querySelector(".rain-layer");
const snowLayer = document.querySelector(".snow-layer");
const sunLayer = document.querySelector(".sun-layer");

let currentUnit = localStorage.getItem("weatherUnit") || "metric";
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
let favoriteCities = JSON.parse(localStorage.getItem("favoriteCities")) || [];
let currentTheme = localStorage.getItem("weatherTheme") || "light";
let lastSearchedCity = localStorage.getItem("lastSearchedCity") || "";
let currentWeatherCity = "";

applyTheme();
updateUnitButtons();
renderRecentSearches();
renderFavoriteCities();
clearWeatherParticles();

if (lastSearchedCity) {
  cityInput.value = lastSearchedCity;
  handleWeatherSearch(lastSearchedCity, false);
}

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const city = cityInput.value.trim();

  if (!city) {
    showMessage("Please enter a city name.", true);
    return;
  }

  await handleWeatherSearch(city);
});

clearHistoryButton.addEventListener("click", () => {
  recentSearches = [];
  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
});

clearFavoritesButton.addEventListener("click", () => {
  favoriteCities = [];
  localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
  renderFavoriteCities();
  updateFavoriteToggleButton();
});

themeToggle.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("weatherTheme", currentTheme);
  applyTheme();
});

locationButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    showMessage("Geolocation is not supported in this browser.", true);
    return;
  }

  setLoadingState(true, "Locating...");

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const weatherPayload = await getWeatherByCoordinates(latitude, longitude);
        const currentData = weatherPayload.current || weatherPayload;
        displayWeatherInfo(currentData);
        renderForecast(weatherPayload.forecast, currentData.timezone, currentData.dt);
        renderHourlyForecast(weatherPayload.forecast, currentData.timezone);
        storeRecentSearch(currentData.name);
        showMessage("Showing weather for your current location.");
      } catch (error) {
        console.error(error);
        showMessage(error.message || "Unable to fetch weather data.", true);
      } finally {
        setLoadingState(false);
      }
    },
    () => {
      setLoadingState(false);
      showMessage("Unable to access your location.", true);
    }
  );
});

favoriteToggle.addEventListener("click", () => {
  if (!currentWeatherCity) return;

  if (isFavoriteCity(currentWeatherCity)) {
    favoriteCities = favoriteCities.filter(
      (city) => city.toLowerCase() !== currentWeatherCity.toLowerCase()
    );
    showMessage(`${currentWeatherCity} removed from favorites.`);
  } else {
    favoriteCities = [currentWeatherCity, ...favoriteCities].slice(0, 8);
    showMessage(`${currentWeatherCity} added to favorites.`);
  }

  localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
  renderFavoriteCities();
  updateFavoriteToggleButton();
});

unitButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selectedUnit = button.dataset.unit;

    if (selectedUnit === currentUnit) return;

    currentUnit = selectedUnit;
    localStorage.setItem("weatherUnit", currentUnit);
    updateUnitButtons();

    const currentCity = cityDisplay.textContent.trim();

    if (currentCity) {
      const cityOnly = currentCity.split(",")[0];
      await handleWeatherSearch(cityOnly, false);
    }
  });
});

async function handleWeatherSearch(city, shouldStore = true) {
  try {
    setLoadingState(true, "Loading weather data...");
    hideMessage();

    const weatherPayload = await getWeatherData(city);
    const currentData = weatherPayload.current || weatherPayload;
    displayWeatherInfo(currentData);
    renderForecast(weatherPayload.forecast, currentData.timezone, currentData.dt);
    renderHourlyForecast(weatherPayload.forecast, currentData.timezone);

    if (shouldStore) {
      storeRecentSearch(currentData.name);
    }

  } catch (error) {
    console.error(error);
    hideWeatherCard();
    showMessage(error.message || "Unable to fetch weather data.", true);
  } finally {
    setLoadingState(false);
  }
}

async function getWeatherData(city) {
  const response = await fetch(
    `/api/weather?city=${encodeURIComponent(city)}&unit=${currentUnit}&includeForecast=true`
  );

  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Weather API route is not working correctly.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch weather data.");
  }

  return data;
}

async function getWeatherByCoordinates(latitude, longitude) {
  const response = await fetch(
    `/api/weather?lat=${latitude}&lon=${longitude}&unit=${currentUnit}&includeForecast=true`
  );

  const contentType = response.headers.get("content-type");

  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Weather API route is not working correctly.");
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch weather for your location.");
  }

  return data;
}

function displayWeatherInfo(data) {
  const {
    name,
    timezone,
    visibility,
    sys: { sunrise, sunset, country },
    main: { temp, feels_like, humidity, pressure, temp_min, temp_max },
    weather: [{ description, id }],
    wind: { speed },
  } = data;

  applyWeatherTheme(id);

  cityDisplay.textContent = `${name}, ${country}`;
  currentWeatherCity = name;
  descDisplay.textContent = description;
  weatherEmoji.textContent = getWeatherEmoji(id);
  locationMeta.textContent = getWeatherMoodLabel(id);
  lastUpdatedDisplay.textContent = `Updated ${formatLastUpdatedTime(timezone)} local time`;
  favoriteToggle.classList.remove("hidden");
  updateFavoriteToggleButton();

  tempDisplay.textContent = `${Math.round(temp)}${getUnitSymbol()}`;
  feelsLikeDisplay.textContent = `Feels like ${Math.round(feels_like)}${getUnitSymbol()}`;

  humidityDisplay.textContent = `${humidity}%`;
  windDisplay.textContent = `${speed} ${currentUnit === "metric" ? "m/s" : "mph"}`;
  pressureDisplay.textContent = `${pressure} hPa`;
  minMaxDisplay.textContent = `${Math.round(temp_min)}${getUnitSymbol()} / ${Math.round(
    temp_max
  )}${getUnitSymbol()}`;

  visibilityDisplay.textContent = formatVisibility(visibility);
  unitDisplay.textContent = currentUnit === "metric" ? "Metric (°C)" : "Imperial (°F)";
  sunriseDisplay.textContent = formatUnixTime(sunrise, timezone);
  sunsetDisplay.textContent = formatUnixTime(sunset, timezone);

  card.classList.remove("hidden");
  restartRevealAnimation();
}

function restartRevealAnimation() {
  card.classList.remove("animate-in");
  void card.offsetWidth;
  card.classList.add("animate-in");
}

function hideWeatherCard() {
  card.classList.add("hidden");
  favoriteToggle.classList.add("hidden");
}

function hideMessage() {
  message.classList.add("hidden");
}

function getWeatherEmoji(weatherId) {
  switch (true) {
    case weatherId >= 200 && weatherId < 300:
      return "🌩️";
    case weatherId >= 300 && weatherId < 400:
      return "🌦️";
    case weatherId >= 500 && weatherId < 600:
      return "🌧️";
    case weatherId >= 600 && weatherId < 700:
      return "❄️";
    case weatherId >= 700 && weatherId < 800:
      return "🌫️";
    case weatherId === 800:
      return "☀️";
    case weatherId >= 801 && weatherId < 810:
      return "☁️";
    default:
      return "❓";
  }
}

function getWeatherMoodLabel(weatherId) {
  switch (true) {
    case weatherId >= 200 && weatherId < 300:
      return "Storm Conditions";
    case weatherId >= 300 && weatherId < 600:
      return "Rainy Conditions";
    case weatherId >= 600 && weatherId < 700:
      return "Snow Conditions";
    case weatherId >= 700 && weatherId < 800:
      return "Atmospheric Conditions";
    case weatherId === 800:
      return "Clear Sky";
    case weatherId >= 801 && weatherId < 810:
      return "Cloudy Conditions";
    default:
      return "Current Conditions";
  }
}

function applyWeatherTheme(weatherId) {
  document.body.classList.remove(
    "weather-sunny",
    "weather-rain",
    "weather-cloudy",
    "weather-snow",
    "weather-storm",
    "weather-mist"
  );

  clearWeatherParticles();

  if (weatherId >= 200 && weatherId < 300) {
    document.body.classList.add("weather-storm");
    createRainDrops(130, true);
  } else if (weatherId >= 300 && weatherId < 600) {
    document.body.classList.add("weather-rain");
    createRainDrops(90, false);
  } else if (weatherId >= 600 && weatherId < 700) {
    document.body.classList.add("weather-snow");
    createSnowflakes(55);
  } else if (weatherId >= 700 && weatherId < 800) {
    document.body.classList.add("weather-mist");
  } else if (weatherId === 800) {
    document.body.classList.add("weather-sunny");
    createSunParticles(10);
  } else if (weatherId >= 801 && weatherId < 810) {
    document.body.classList.add("weather-cloudy");
  }
}

function clearWeatherParticles() {
  if (rainLayer) rainLayer.innerHTML = "";
  if (snowLayer) snowLayer.innerHTML = "";
  if (sunLayer) sunLayer.innerHTML = "";
}

function createRainDrops(count = 90, isStorm = false) {
  if (!rainLayer) return;

  rainLayer.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const drop = document.createElement("span");
    drop.className = "rain-drop";

    const left = Math.random() * 100;
    const height = 45 + Math.random() * 55;
    const delay = Math.random() * 2;
    const duration = (isStorm ? 0.4 : 0.55) + Math.random() * 0.45;
    const opacity = (isStorm ? 0.35 : 0.2) + Math.random() * 0.4;

    drop.style.left = `${left}%`;
    drop.style.height = `${height}px`;
    drop.style.animationDelay = `${delay}s`;
    drop.style.animationDuration = `${duration}s`;
    drop.style.opacity = opacity;

    rainLayer.appendChild(drop);
  }
}

function createSnowflakes(count = 55) {
  if (!snowLayer) return;

  snowLayer.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const flake = document.createElement("span");
    flake.className = "snowflake";
    flake.textContent = Math.random() > 0.5 ? "❄" : "✦";

    const left = Math.random() * 100;
    const size = 0.7 + Math.random() * 1.2;
    const delay = Math.random() * 8;
    const duration = 7 + Math.random() * 8;
    const drift = -40 + Math.random() * 80;

    flake.style.left = `${left}%`;
    flake.style.fontSize = `${size}rem`;
    flake.style.animationDelay = `${delay}s`;
    flake.style.animationDuration = `${duration}s`;
    flake.style.setProperty("--drift", `${drift}px`);

    snowLayer.appendChild(flake);
  }
}

function createSunParticles(count = 10) {
  if (!sunLayer) return;

  sunLayer.innerHTML = "";

  for (let i = 0; i < count; i += 1) {
    const orb = document.createElement("span");
    orb.className = "sun-particle";

    const top = 8 + Math.random() * 35;
    const right = 6 + Math.random() * 30;
    const size = 14 + Math.random() * 38;
    const delay = Math.random() * 4;
    const duration = 5 + Math.random() * 6;

    orb.style.top = `${top}%`;
    orb.style.right = `${right}%`;
    orb.style.width = `${size}px`;
    orb.style.height = `${size}px`;
    orb.style.animationDelay = `${delay}s`;
    orb.style.animationDuration = `${duration}s`;

    sunLayer.appendChild(orb);
  }
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.remove("hidden");
  message.style.color = isError ? "var(--danger)" : "";
}

function setLoadingState(isLoading, buttonText = "Search") {
  submitButton.disabled = isLoading;
  locationButton.disabled = isLoading;
  weatherForm.setAttribute("aria-busy", isLoading ? "true" : "false");
  submitButton.textContent = isLoading ? buttonText : "Search";
}

function storeRecentSearch(city) {
  const normalizedCity = city.trim();
  lastSearchedCity = normalizedCity;
  localStorage.setItem("lastSearchedCity", normalizedCity);

  recentSearches = [
    normalizedCity,
    ...recentSearches.filter(
      (item) => item.toLowerCase() !== normalizedCity.toLowerCase()
    ),
  ].slice(0, 6);

  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  historyList.innerHTML = "";

  if (recentSearches.length === 0) {
    historyList.innerHTML = `<p class="empty-text">No recent searches yet.</p>`;
    return;
  }

  recentSearches.forEach((city) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = city;
    button.className = "history-chip";

    button.addEventListener("click", async () => {
      cityInput.value = city;
      await handleWeatherSearch(city, false);
    });

    historyList.appendChild(button);
  });
}

function renderFavoriteCities() {
  favoritesList.innerHTML = "";

  if (favoriteCities.length === 0) {
    favoritesList.innerHTML = `<p class="empty-text">No favorite cities yet.</p>`;
    return;
  }

  favoriteCities.forEach((city) => {
    const wrap = document.createElement("div");
    wrap.className = "favorite-chip-wrap";

    const cityButton = document.createElement("button");
    cityButton.type = "button";
    cityButton.textContent = city;
    cityButton.className = "history-chip";
    cityButton.addEventListener("click", async () => {
      cityInput.value = city;
      await handleWeatherSearch(city, false);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "chip-remove";
    removeButton.setAttribute("aria-label", `Remove ${city} from favorites`);
    removeButton.textContent = "×";
    removeButton.addEventListener("click", () => {
      favoriteCities = favoriteCities.filter(
        (item) => item.toLowerCase() !== city.toLowerCase()
      );
      localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
      renderFavoriteCities();
      updateFavoriteToggleButton();
    });

    wrap.appendChild(cityButton);
    wrap.appendChild(removeButton);
    favoritesList.appendChild(wrap);
  });
}

function isFavoriteCity(city) {
  return favoriteCities.some((item) => item.toLowerCase() === city.toLowerCase());
}

function updateFavoriteToggleButton() {
  if (!currentWeatherCity) return;

  favoriteToggle.textContent = isFavoriteCity(currentWeatherCity)
    ? "Remove from Favorites"
    : "Add to Favorites";
}

function renderForecast(forecastData, timezoneOffsetSeconds = 0, currentUnixTime = 0) {
  forecastGrid.innerHTML = "";

  if (!forecastData || !Array.isArray(forecastData.list)) {
    forecastGrid.innerHTML = `<p class="empty-text">Forecast unavailable right now.</p>`;
    return;
  }

  const currentLocalDate = getLocalDateLabel(currentUnixTime, timezoneOffsetSeconds);
  const bestPerDay = new Map();

  forecastData.list.forEach((entry) => {
    const localDate = new Date((entry.dt + timezoneOffsetSeconds) * 1000);
    const dateKey = localDate.toISOString().slice(0, 10);

    if (dateKey === currentLocalDate) return;

    const hourDistance = Math.abs(localDate.getUTCHours() - 12);
    const existing = bestPerDay.get(dateKey);

    if (!existing || hourDistance < existing.hourDistance) {
      bestPerDay.set(dateKey, { entry, hourDistance });
    }
  });

  const cards = [...bestPerDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 5);

  if (cards.length === 0) {
    forecastGrid.innerHTML = `<p class="empty-text">Forecast unavailable right now.</p>`;
    return;
  }

  cards.forEach(([dateKey, payload]) => {
    const {
      entry: {
        weather: [{ id, description }],
        main: { temp_min, temp_max },
      },
    } = payload;

    const dayDate = new Date(`${dateKey}T00:00:00Z`);
    const dayName = dayDate.toLocaleDateString([], {
      weekday: "short",
      timeZone: "UTC",
    });

    const cardItem = document.createElement("article");
    cardItem.className = "forecast-card";
    cardItem.innerHTML = `
      <span class="forecast-day">${dayName}</span>
      <span class="forecast-emoji">${getWeatherEmoji(id)}</span>
      <span class="forecast-temp">${Math.round(temp_min)}${getUnitSymbol()} / ${Math.round(
      temp_max
    )}${getUnitSymbol()}</span>
      <span class="forecast-desc">${description}</span>
    `;

    forecastGrid.appendChild(cardItem);
  });
}

function renderHourlyForecast(forecastData, timezoneOffsetSeconds = 0) {
  hourlyGrid.innerHTML = "";

  if (!forecastData || !Array.isArray(forecastData.list)) {
    hourlyGrid.innerHTML = `<p class="empty-text">Hourly trend unavailable right now.</p>`;
    return;
  }

  const upcomingEntries = forecastData.list.slice(0, 8);

  if (upcomingEntries.length === 0) {
    hourlyGrid.innerHTML = `<p class="empty-text">Hourly trend unavailable right now.</p>`;
    return;
  }

  const temps = upcomingEntries.map((entry) => entry.main.temp);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const range = Math.max(maxTemp - minTemp, 1);

  upcomingEntries.forEach((entry) => {
    const localDate = new Date((entry.dt + timezoneOffsetSeconds) * 1000);
    const timeLabel = localDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    const temp = entry.main.temp;
    const fillHeight = ((temp - minTemp) / range) * 100;

    const cardItem = document.createElement("article");
    cardItem.className = "hourly-card";
    cardItem.innerHTML = `
      <span class="hourly-time">${timeLabel}</span>
      <span class="hourly-temp">${Math.round(temp)}${getUnitSymbol()}</span>
      <div class="hourly-bar-track" aria-hidden="true">
        <div class="hourly-bar-fill" style="height: ${Math.max(fillHeight, 10)}%"></div>
      </div>
    `;

    hourlyGrid.appendChild(cardItem);
  });
}

function getUnitSymbol() {
  return currentUnit === "metric" ? "°C" : "°F";
}

function updateUnitButtons() {
  unitButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.unit === currentUnit);
  });
}

function applyTheme() {
  document.body.classList.toggle("dark", currentTheme === "dark");
  themeToggle.textContent = currentTheme === "dark" ? "Light Mode" : "Dark Mode";
}

function formatVisibility(value) {
  if (typeof value !== "number") return "N/A";

  if (currentUnit === "metric") {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return `${(value / 1609).toFixed(1)} mi`;
}

function formatUnixTime(unixTime, timezoneOffsetSeconds = 0) {
  if (!unixTime) return "N/A";

  const localDate = new Date((unixTime + timezoneOffsetSeconds) * 1000);

  return localDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function formatLastUpdatedTime(timezoneOffsetSeconds = 0) {
  const localDate = new Date(Date.now() + timezoneOffsetSeconds * 1000);

  return localDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function getLocalDateLabel(unixTime, timezoneOffsetSeconds = 0) {
  return new Date((unixTime + timezoneOffsetSeconds) * 1000)
    .toISOString()
    .slice(0, 10);
}
