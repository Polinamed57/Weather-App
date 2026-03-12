# SkyCast Weather App

A responsive weather dashboard built with vanilla HTML, CSS, and JavaScript.

It shows:

- Current weather by city or geolocation
- 5-day forecast cards
- Hourly temperature trend cards
- Favorite cities and recent searches (saved in localStorage)
- Unit switching (C/F)
- Light and dark theme

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend API route: Vercel Serverless Function (`api/weather.js`)
- Weather provider: OpenWeather API

## Requirements

- Node.js 18+
- OpenWeather API key
- Vercel CLI (recommended for local dev)

## Environment Variables

Create `.env.local` in the project root:

```bash
OPENWEATHER_API_KEY=your_openweather_api_key
```

## Run Locally

This app uses a serverless API route (`/api/weather`), so run it with Vercel Dev.

1. Install Vercel CLI (if needed):

```bash
npm i -g vercel
```

2. Start local dev server from project root:

```bash
vercel dev
```

3. Open the local URL shown in the terminal (usually `http://localhost:3000`).

## API Route

`GET /api/weather`

Query params:

- `city` (string) OR `lat` + `lon` (numbers)
- `unit` (`metric` or `imperial`)
- `includeForecast` (`true` or `false`)

Examples:

```bash
/api/weather?city=London&unit=metric&includeForecast=true
/api/weather?lat=51.5072&lon=-0.1276&unit=imperial&includeForecast=true
```

Response shape:

- If `includeForecast=false`: current weather object
- If `includeForecast=true`: `{ current, forecast }`

## Features Overview

- Search city weather
- Use current location weather
- Save and manage favorites
- Save and reuse recent searches
- 5-day forecast summary cards
- Hourly temperature trend visualization
- Dynamic weather-themed backgrounds/effects
- Dark mode and metric/imperial persistence

## Deployment

Deploy on Vercel:

1. Push this repo to GitHub.
2. Import the project in Vercel.
3. Add environment variable:

- `OPENWEATHER_API_KEY`

4. Deploy.

## Troubleshooting

- `Missing API key.`
  Add `OPENWEATHER_API_KEY` to `.env.local` (local) or Vercel env vars (production).

- `Weather API route is not working correctly.`
  Usually means the API route failed or returned non-JSON. Check terminal logs and API key.

- Geolocation not working:
  Use HTTPS in production and allow location permission in browser.
