import fs from "node:fs";
import path from "node:path";

function getApiKeyFromLocalEnvFile() {
  const envFiles = [".env.local", ".env"];

  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file);

    if (!fs.existsSync(envPath)) continue;

    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line || line.startsWith("#")) continue;

      const equalsIndex = line.indexOf("=");
      if (equalsIndex === -1) continue;

      const key = line.slice(0, equalsIndex).trim();
      let value = line.slice(equalsIndex + 1).trim();

      if (key !== "OPENWEATHER_API_KEY") continue;

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (value) return value;
    }
  }

  return "";
}

export default async function handler(req, res) {
  const { city, lat, lon, unit = "metric", includeForecast = "false" } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY || getApiKeyFromLocalEnvFile();

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key." });
  }

  let apiUrl = "";

  if (city) {
    apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=${unit}`;
  } else if (lat && lon) {
    const parsedLat = parseFloat(lat);
    const parsedLon = parseFloat(lon);

    if (isNaN(parsedLat) || isNaN(parsedLon) || parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
      return res.status(400).json({ error: "Invalid coordinates." });
    }

    apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${parsedLat}&lon=${parsedLon}&appid=${apiKey}&units=${unit}`;
  } else {
    return res.status(400).json({ error: "City or coordinates are required." });
  }

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || "Unable to fetch weather data.",
      });
    }

    if (includeForecast !== "true") {
      return res.status(200).json(data);
    }

    const {
      coord: { lat: resolvedLat, lon: resolvedLon },
    } = data;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${resolvedLat}&lon=${resolvedLon}&appid=${apiKey}&units=${unit}`;
    const forecastResponse = await fetch(forecastUrl);
    const forecastData = await forecastResponse.json();

    if (!forecastResponse.ok) {
      return res.status(forecastResponse.status).json({
        error: forecastData?.message || "Unable to fetch forecast data.",
      });
    }

    return res.status(200).json({
      current: data,
      forecast: forecastData,
    });
  } catch {
    return res.status(500).json({ error: "Server error." });
  }
}
