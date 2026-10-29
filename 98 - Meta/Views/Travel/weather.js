// weather.js — now, 7-day forecast, sunrise/sunset, UV and air quality (Open-Meteo, no key). input: { lat, lng }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const { lat, lng } = input ?? {};
if (lat === undefined || lng === undefined) { D.p(dv.container, "Weather unavailable (no coordinates)"); return; }
const KEY = `travel-vault-wx2-${lat},${lng}`;   // bump the version when the request changes
const el = dv.el("div", "Loading weather…");
const fetcher = async () => {
    const url = "https://api.open-meteo.com/v1/forecast"
        + `?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=7`
        + "&current=temperature_2m,apparent_temperature,weather_code"
        + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max";
    const res = await fetch(url);
    if (!res.ok) { console.error("Weather fetch failed", res.status, await res.text()); return null; }
    const data = await res.json();
    try {   // air quality is a separate Open-Meteo API; optional
        const aq = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=auto`);
        if (aq.ok) data.aqi = (await aq.json()).current?.us_aqi ?? null;
    } catch (e) {}
    return data;
};
// WMO weather codes → icon + label
const WMO = (c) => c === 0 ? ["☀️", "Clear"] : c <= 2 ? ["🌤️", "Partly cloudy"] : c === 3 ? ["☁️", "Overcast"]
    : c <= 48 ? ["🌫️", "Fog"] : c <= 57 ? ["🌦️", "Drizzle"] : c <= 67 ? ["🌧️", "Rain"] : c <= 77 ? ["🌨️", "Snow"]
    : c <= 82 ? ["🌦️", "Showers"] : c <= 86 ? ["🌨️", "Snow showers"] : ["⛈️", "Thunderstorm"];
const r = (n) => (n === null || n === undefined ? "–" : Math.round(n));
const draw = (data) => {
    el.empty();
    if (!data?.daily?.time) { el.setText("Weather unavailable"); return; }
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
    D.p(el, lines.join("<br>"));
};
// shows the last forecast immediately (even if old) and refreshes it in the background after an hour
await (await lib("cache")).staleFirst({ key: KEY, maxAgeMs: 3600e3, fetcher, draw, empty: () => el.setText("Weather unavailable") });
