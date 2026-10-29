// tripEssentials.js — dates, length, status, countries and cities on this trip
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const fmt = (k) => dv.date(k).toFormat("ccc d LLL yyyy");
const links = (list) => list.length ? list.map((p) => `[[${p.file.path}|${p.file.name.replace(/,[^,]*$/, "")}]]`).join(", ") : "—";
D.p(dv.container, [
    `**Start** ${t.start ? fmt(t.start) : "TBC"}`,
    `**End** ${t.end ? fmt(t.end) : "TBC"}`,
    `**Length** ${t.days ? `${t.days} days · ${t.days - 1} nights` : "—"}`,
    `**Booked** ${trip.Booked ? "Yes" : "No"}`,
    `**Countries** ${links(t.countries)}`,
    `**Cities** ${links(t.locales)}`,
].join("<br>"));
