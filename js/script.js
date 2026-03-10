const weatherForm = document.querySelector("#weatherForm");
const cityInput = document.querySelector("#cityInput");
const submitButton = document.querySelector("#submitButton");
const card = document.querySelector("#card");
const message = document.querySelector("#message");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
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

let currentUnit = localStorage.getItem("weatherUnit") || "metric";
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
let currentTheme = localStorage.getItem("weatherTheme") || "light";

applyTheme();
updateUnitButtons();
renderRecentSearches();

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
        const weatherData = await getWeatherByCoordinates(latitude, longitude);
        displayWeatherInfo(weatherData);
        storeRecentSearch(weatherData.name);
        showMessage(`Showing weather for your current location.`);
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

unitButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selectedUnit = button.dataset.unit;

    if (selectedUnit === currentUnit) return;

    currentUnit = selectedUnit;
    localStorage.setItem("weatherUnit", currentUnit);
    updateUnitButtons();

    const currentCity = cityDisplay.textContent.trim();

    if (currentCity) {
      await handleWeatherSearch(currentCity, false);
    }
  });
});

async function handleWeatherSearch(city, shouldStore = true) {
  try {
    setLoadingState(true, "Loading weather data...");

    const weatherData = await getWeatherData(city);
    displayWeatherInfo(weatherData);

    if (shouldStore) {
      storeRecentSearch(weatherData.name);
    }

    showMessage(`Weather loaded successfully for ${weatherData.name}.`);
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
    `/api/weather?city=${encodeURIComponent(city)}&unit=${currentUnit}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch weather data.");
  }

  return data;
}

async function getWeatherByCoordinates(latitude, longitude) {
  const response = await fetch(
    `/api/weather?lat=${latitude}&lon=${longitude}&unit=${currentUnit}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Unable to fetch weather for your location.");
  }

  return data;
}

function displayWeatherInfo(data) {
  const {
    name,
    main: { temp, feels_like, humidity, pressure, temp_min, temp_max },
    weather: [{ description, id }],
    wind: { speed },
  } = data;

  cityDisplay.textContent = name;
  descDisplay.textContent = description;
  weatherEmoji.textContent = getWeatherEmoji(id);

  tempDisplay.textContent = `${Math.round(temp)}${getUnitSymbol()}`;
  feelsLikeDisplay.textContent = `Feels like ${Math.round(feels_like)}${getUnitSymbol()}`;
  humidityDisplay.textContent = `${humidity}%`;
  windDisplay.textContent = `${speed} ${currentUnit === "metric" ? "m/s" : "mph"}`;
  pressureDisplay.textContent = `${pressure} hPa`;
  minMaxDisplay.textContent = `${Math.round(temp_min)}${getUnitSymbol()} / ${Math.round(
    temp_max
  )}${getUnitSymbol()}`;

  card.classList.remove("hidden");
}

function hideWeatherCard() {
  card.classList.add("hidden");
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

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.remove("hidden");
  message.style.color = isError ? "var(--danger)" : "";

}

function setLoadingState(isLoading, buttonText = "Get Weather") {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? buttonText : "Get Weather";
}

function storeRecentSearch(city) {
  const normalizedCity = city.trim();

  recentSearches = [
    normalizedCity,
    ...recentSearches.filter((item) => item.toLowerCase() !== normalizedCity.toLowerCase()),
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