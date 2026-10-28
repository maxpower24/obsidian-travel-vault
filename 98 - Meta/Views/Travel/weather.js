// weather.js — now, 7-day forecast, sunrise/sunset, UV and air quality (Open-Meteo, no key). input: { lat, lng }
const { lat, lng } = input ?? {};
if (lat === undefined || lng === undefined) { dv.paragraph("Weather unavailable (no coordinates)"); return; }
const KEY = `travel-vault-wx2-${lat},${lng}`;   // bump the version when the request changes
const el = dv.el("div", "Loading weather…");
let data = null;
try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && Date.now() - c.saved < 3600e3) data = c.data; } catch (e) {}
if (!data) {
    try {
        const url = "https://api.open-meteo.com/v1/forecast"
            + `?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=7`
            + "&current=temperature_2m,apparent_temperature,weather_code"
            + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max";
        const res = await fetch(url);
        if (res.ok) {
            data = await res.json();
            try {   // air quality is a separate Open-Meteo API; optional
                const aq = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=auto`);
                if (aq.ok) data.aqi = (await aq.json()).current?.us_aqi ?? null;
            } catch (e) {}
            localStorage.setItem(KEY, JSON.stringify({ saved: Date.now(), data }));
        }
        else console.error("Weather fetch failed", res.status, await res.text());
    } catch (e) { console.error("Weather fetch failed", e); }
}
el.empty();
if (!data?.daily?.time) { el.setText("Weather unavailable"); return; }
// WMO weather codes → icon + label
const WMO = (c) => c === 0 ? ["☀️", "Clear"] : c <= 2 ? ["🌤️", "Partly cloudy"] : c === 3 ? ["☁️", "Overcast"]
    : c <= 48 ? ["🌫️", "Fog"] : c <= 57 ? ["🌦️", "Drizzle"] : c <= 67 ? ["🌧️", "Rain"] : c <= 77 ? ["🌨️", "Snow"]
    : c <= 82 ? ["🌦️", "Showers"] : c <= 86 ? ["🌨️", "Snow showers"] : ["⛈️", "Thunderstorm"];
const r = (n) => (n === null || n === undefined ? "–" : Math.round(n));
const d = data.daily;
const lines = [];
if (data.current) {
    const [icon, label] = WMO(data.current.weather_code);
    lines.push(`<span style="font-size:1.8em;font-weight:600;line-height:1.1">${r(data.current.temperature_2m)}°</span> ${icon} ${label}`);
    lines.push(`<small>Feels like ${r(data.current.apparent_temperature)}°</small>`);
}
d.time.forEach((day, i) => {
    const wd = new Date(day + "T00:00").toLocaleDateString("en-AU", { weekday: "short" });
    const rain = d.precipitation_probability_max?.[i];
    lines.push(`${wd} ${WMO(d.weather_code[i])[0]} ${r(d.temperature_2m_max[i])}° / ${r(d.temperature_2m_min[i])}°${rain ? ` · ${rain}%` : ""}`);
});
if (d.sunrise?.[0]) lines.push(`🌅 ${d.sunrise[0].slice(11, 16)} · 🌇 ${d.sunset[0].slice(11, 16)}`);
const uv = d.uv_index_max?.[0];
const uvText = uv === null || uv === undefined ? "" : `UV ${Math.round(uv)} ${uv < 3 ? "low" : uv < 6 ? "moderate" : uv < 8 ? "high" : uv < 11 ? "very high" : "extreme"}`;
const aqi = data.aqi;
const aqiText = aqi === null || aqi === undefined ? "" : `Air ${aqi} ${aqi <= 50 ? "good" : aqi <= 100 ? "moderate" : aqi <= 150 ? "poor for some" : aqi <= 200 ? "unhealthy" : "very unhealthy"}`;
if (uvText || aqiText) lines.push(`<small>${[uvText, aqiText].filter(Boolean).join(" · ")}</small>`);
dv.paragraph(lines.join("<br>"), { container: el });
