// todayNext.js — During: today + tomorrow · Before: the first two days with plans · otherwise hidden
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
// hide the surrounding box if the widget is in one, otherwise just this block (never a whole column)
const hideBox = (el) => (el.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? el.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden");
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const box = dv.el("div", "", { cls: "travel-next" });
if (!["Before", "During"].includes(t.phase)) { hideBox(box); return; }
const L = await lib("itinLine").then((f) => f({ dv, app }));
const on = (k) => t.dated.filter((p) => t.key(p.Start) === k);
const when = (p) => { const s = dv.date(p.Start); return s.hour || s.minute ? s.toFormat("HH:mm") : (p.Subtype === "Stay" ? "Check in" : ""); };
const section = (title, items) => {
    box.createEl("strong", { text: title });
    if (!items.length) box.createDiv({ cls: "travel-muted", text: "Nothing planned" });
    for (const p of items) L.line(box, p, when(p));
};
if (t.phase === "During") {
    section("Today", on(t.today));
    section("Tomorrow", on(t.add(t.today, 1)));
} else {
    const days = [...new Set(t.dated.map((p) => t.key(p.Start)))].slice(0, 2);
    if (!days.length) { section("Next Up", []); return; }
    for (const k of days) section(dv.date(k).toFormat("ccc d LLL"), on(k));
}
