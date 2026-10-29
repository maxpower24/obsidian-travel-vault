// route.js — the trip as a timeline: one segment per city (width = nights), unbooked nights hatched,
// transport legs as icons at their date, a marker for today during the trip.
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
// hide the surrounding box if the widget is in one, otherwise just this block (never a whole column)
const hideBox = (el) => (el.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? el.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden");
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const L = await lib("itinLine").then((f) => f({ dv, app }));
const box = dv.el("div", "", { cls: "travel-route" });
const head = box.createDiv({ cls: "travel-route-head" });
head.createEl("strong", { text: "Route" });
if (!t.nights.length) { box.createDiv({ cls: "travel-muted", text: "Set the trip's Start and End to see the route" }); return; }

// group consecutive nights by where you sleep
// a stay with no city still counts as booked; it just has no link
const cityOn = (k) => { const s = t.stays.find((p) => t.key(p.Start) <= k && (t.key(p.End) ?? t.add(t.key(p.Start), 1)) > k); return s ? (s.Locale ? dv.page(s.Locale) : null) ?? { file: { name: "Stay", path: "stay:" + s.file.path }, nolink: true } : null; };
const segs = [];
for (const k of t.nights) {
    const c = cityOn(k), id = c ? c.file.path : "gap", last = segs[segs.length - 1];
    if (last && last.id === id) last.nights++; else segs.push({ id, city: c, nights: 1, from: k });
}
const hue = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
const total = t.nights.length;
const bar = box.createDiv({ cls: "travel-route-bar" });
for (const s of segs) {
    const seg = bar.createDiv({ cls: "travel-route-seg" + (s.city ? "" : " is-gap") });
    seg.style.flexGrow = s.nights;
    if (s.city) seg.style.setProperty("--seg-hue", hue(s.id));
    const name = s.city ? s.city.file.name.replace(/,[^,]*$/, "") : "Unbooked";
    seg.setAttr("title", `${name} · ${s.nights} night${s.nights === 1 ? "" : "s"} from ${dv.date(s.from).toFormat("d LLL")}`);
    const lab = seg.createDiv({ cls: "travel-route-label" });
    if (s.city && !s.city.nolink) D.span(lab.createSpan(), `[[${s.city.file.path}|${name}]]`); else lab.createSpan({ text: name });
    lab.createSpan({ cls: "travel-route-nights", text: ` ${s.nights}` });
}
// transport legs and today, positioned by date across the bar
const pos = (k) => Math.max(0, Math.min(100, (t.span(t.start, k) / total) * 100));
const marks = box.createDiv({ cls: "travel-route-marks" });
for (const p of t.transport) {
    const m = marks.createDiv({ cls: "travel-route-mark", text: L.iconFor(p) });
    m.style.left = `${pos(t.key(p.Start))}%`;
    m.setAttr("title", `${dv.date(p.Start).toFormat("ccc d LLL")} · ${L.label(p)}`);
}
if (t.phase === "During") { const m = marks.createDiv({ cls: "travel-route-today" }); m.style.left = `${pos(t.today)}%`; m.setAttr("title", "Today"); }
const ends = box.createDiv({ cls: "travel-route-ends travel-muted" });
ends.createSpan({ text: dv.date(t.start).toFormat("d LLL") });
ends.createSpan({ text: dv.date(t.end).toFormat("d LLL") });
