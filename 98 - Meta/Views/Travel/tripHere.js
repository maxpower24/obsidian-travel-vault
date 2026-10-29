// tripHere.js — local time + weather for today's city during the trip, else the first stop
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const city = t.here ?? t.first;
if (!city) { D.p(dv.container, "<small>Add a stay to see local time and weather</small>"); return; }
const name = city.file.name.replace(/,[^,]*$/, "");
D.p(dv.container, `**${t.here ? "Now in" : "First stop"}** [[${city.file.path}|${name}]]`);
if (city.Timezone) await dv.view("98 - Meta/Views/Travel/localTime", { tz: city.Timezone, place: name });
const ll = String(city.Coordinates ?? "").split(",").map(Number);
if (ll.length === 2 && ll.every(Number.isFinite)) await dv.view("98 - Meta/Views/Travel/weather", { lat: ll[0], lng: ll[1] });
else D.p(dv.container, "<small>Rebuild this city for weather</small>");
