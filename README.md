# Backyard weather page

Live conditions from an Ecowitt station + a 6-day forecast, on a static page
refreshed by a free GitHub Action. No server, no paid keys.

## What's on the page
- **Current conditions** from your Ecowitt station (temp, wind, rain, humidity,
  pressure, UV, solar) with an animated mascot that switches on live data.
  Seven moods: sunny, partly cloudy, cloudy, windy, raining, thunderstorm, clear night.
- **6-day forecast** for Nannup from Open-Meteo (free, no key, BOM/ECMWF models),
  stacked as full-width pills.
- **Last 24h charts** for recorded temperature and rain.

## How it works
- A GitHub Action polls Ecowitt's official API every ~5 min (keys in repo secrets)
  and commits `data.json`. The page reads it and re-checks each minute.
- The forecast is fetched **client-side** straight from Open-Meteo (CORS-allowed),
  so it needs no key and no Action — it just works in the browser.

## Setup (~5 min)
1. ecowitt.net → profile → generate Application Key + API Key. Grab station MAC
   from the WS View Plus app.
2. Make a repo, add: `index.html`, `bg.webp`, `update.mjs`, `data.json`,
   `.github/workflows/weather.yml` (keep that path).
3. Repo → Settings → Secrets and variables → Actions → add `ECOWITT_APP_KEY`,
   `ECOWITT_API_KEY`, `ECOWITT_MAC`. Optional: Variables → `STATION_NAME`.
4. Settings → Pages → deploy from `main` / root.
5. Actions → run "Update weather data" once. Live at `https://<you>.github.io/<repo>/`.

## Tweaks
- **Forecast location:** edit `FC_LAT`, `FC_LON`, `FC_NAME` at the top of the
  `<script>` in `index.html` (currently Nannup, -33.98/115.77).
- **Match WillyWeather's source exactly:** set `FC_MODEL="bom_access_global"` to
  force the BOM model only. Left blank, Open-Meteo blends best-available models.
- **Units** metric; change `*_unitid` in `update.mjs` for imperial.
- **Mascot triggers:** windy fires at gust >=40 or wind >=28 km/h (tweak in `pick()`).
  Thunderstorm needs an Ecowitt **WH57 lightning sensor** — without one it never fires;
  we can tune it once we see real lightning data in `data.json`.
- Cron floor 5 min, best-effort → refresh every 5–10 min.
- Pages is public + indexable — anyone with the link sees the photo.
- Extra station sensors (soil, lightning, PM2.5, channels)? Send the first
  `data.json` and they get wired into the cards.
