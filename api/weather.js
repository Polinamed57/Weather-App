export default async function handler(req, res) {
  const { city, lat, lon, unit = "metric" } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing API key." });
  }

  let apiUrl = "";

  if (city) {
    apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city
    )}&appid=${apiKey}&units=${unit}`;
  } else if (lat && lon) {
    apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
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

    return res.status(200).json(data);
  } catch {
    return res.status(500).json({ error: "Server error." });
  }
}