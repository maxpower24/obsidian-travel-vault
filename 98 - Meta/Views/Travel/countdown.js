// countdown.js — changes with the trip's phase: in N days / Day N of M / summary
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const box = dv.el("div", "", { cls: "travel-countdown" });
const big = (n, unit) => { box.createDiv({ cls: "travel-countdown-big", text: String(n) }); box.createDiv({ cls: "travel-countdown-unit", text: unit }); };
const where = (p) => p ? p.file.name.replace(/,[^,]*$/, "") : null;
if (t.phase === "Idea") { big("—", "Dates TBC"); }
else if (t.phase === "Cancelled") { big("—", "Cancelled"); }
else if (t.phase === "Before") {
    const n = t.span(t.today, t.start);
    big(n, n === 1 ? "day to go" : "days to go");
    if (t.first) D.p(box, `<small>First stop: [[${t.first.file.path}|${where(t.first)}]]</small>`);
} else if (t.phase === "During") {
    big(`Day ${t.dayN}`, t.days ? `of ${t.days}` : "");
    if (t.here) D.p(box, `<small>In [[${t.here.file.path}|${where(t.here)}]]</small>`);
} else {
    const places = new Set(t.itins.map((p) => p.Place && dv.page(p.Place)?.file.path).filter(Boolean)).size;
    big(t.days ?? "—", "days");
    D.p(box, `<small>${t.countries.length} countr${t.countries.length === 1 ? "y" : "ies"} · ${t.locales.length} cit${t.locales.length === 1 ? "y" : "ies"} · ${places} place${places === 1 ? "" : "s"}</small>`);
}
