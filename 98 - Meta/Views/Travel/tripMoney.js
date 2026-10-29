// tripMoney.js — exchange rates for every currency on the trip (from the countries' Currency Codes)
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const codes = [...new Set(t.countries.flatMap((c) => [].concat(c["Currency Codes"] ?? [])))];
if (!codes.length) { D.p(dv.container, "<small>No currencies yet (rebuild the countries if this stays empty)</small>"); return; }
await dv.view("98 - Meta/Views/Travel/fx", { codes });
