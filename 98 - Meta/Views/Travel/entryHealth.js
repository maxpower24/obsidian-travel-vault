// entryHealth.js — Visa, Vaccine and Smartraveller for each country on the trip (read live from the countries)
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
D.p(dv.container, "**Entry & Health**");
if (!t.countries.length) { D.p(dv.container, "<small>Countries appear once the trip has itinerary notes</small>"); return; }
D.p(dv.container, t.countries.map((c) => [
    `[[${c.file.path}|${c.file.name}]]`,
    `<small>Visa</small> ${c.Visa || "—"} · <small>Vaccine</small> ${c.Vaccine || c.Vaccines || "—"}`,
    `[Smartraveller](https://www.smartraveller.gov.au/search?search=${encodeURIComponent(c.file.name)})`,
].join("<br>")).join("<br><br>"));
