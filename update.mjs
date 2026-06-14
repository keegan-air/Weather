// Runs inside GitHub Actions on a timer. Pulls current conditions from Ecowitt's
// official API using secrets, keeps a rolling 24h temperature history, writes data.json.
// No keys ever touch data.json or the public page.
import { readFile, writeFile } from "node:fs/promises";

const { ECOWITT_APP_KEY, ECOWITT_API_KEY, ECOWITT_MAC } = process.env;
const STATION = process.env.STATION_NAME || "Backyard Station";

if (!ECOWITT_APP_KEY || !ECOWITT_API_KEY || !ECOWITT_MAC) {
  console.error("Missing one of ECOWITT_APP_KEY / ECOWITT_API_KEY / ECOWITT_MAC");
  process.exit(1);
}

// Metric units: temp=°C(1), wind=km/h(7), pressure=hPa(3), rain=mm(12). Change if you want imperial.
const url = "https://api.ecowitt.net/api/v3/device/real_time"
  + `?application_key=${ECOWITT_APP_KEY}`
  + `&api_key=${ECOWITT_API_KEY}`
  + `&mac=${ECOWITT_MAC}`
  + "&call_back=all&temp_unitid=1&wind_speed_unitid=7&pressure_unitid=3&rainfall_unitid=12";

const res = await fetch(url);
const json = await res.json();
if (json.code !== 0) {
  console.error("Ecowitt API error:", json.code, json.msg);
  process.exit(1);
}
const current = json.data || {};

// roll the history forward
let history = [];
try { history = JSON.parse(await readFile("data.json", "utf8")).history || []; } catch {}
const tempVal = parseFloat(current?.outdoor?.temperature?.value);
const rateVal = parseFloat(current?.rainfall?.rain_rate?.value);
if (!isNaN(tempVal)) history.push({
  t: Math.floor(Date.now() / 1000),
  temp: +tempVal.toFixed(1),
  rain: isNaN(rateVal) ? 0 : +rateVal.toFixed(2),
});
const cutoff = Math.floor(Date.now() / 1000) - 24 * 3600;
history = history.filter(p => p.t >= cutoff).slice(-288); // ~24h, defensive cap

await writeFile("data.json", JSON.stringify(
  { updated: new Date().toISOString(), station: STATION, current, history }, null, 0));
console.log("Wrote data.json — temp", tempVal, "history points", history.length);
