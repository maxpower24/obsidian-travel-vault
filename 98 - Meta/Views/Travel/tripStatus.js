// tripStatus.js — status badge + dates for a trip note
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const status = t.phase === "Cancelled" ? "Cancelled" : t.phase === "Idea" ? "Idea" : t.phase === "After" ? "Done"
             : t.phase === "During" ? "Active" : trip.Booked ? "Booked" : "Planning";
const fmt = (k) => dv.date(k).toFormat("d LLL yyyy");
const dates = t.start ? `${fmt(t.start)}${t.end ? " – " + fmt(t.end) : ""}` : "Dates TBC";
const el = dv.el("div", "", { cls: "travel-status-bar" });
D.p(el, `<span class="travel-status travel-status-${status.toLowerCase()}">${status}</span> · ${dates}`);
