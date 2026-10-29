// onThePlan.js — "Coming Up": upcoming dated itinerary notes here, soonest first. Hidden when nothing is planned.
// input: { field: "Locale" | "Country", limit: 6 } — on a country note each line also names its city.
// Lines link the place / city (never the itinerary note); ✏️ edits the itinerary note in a pop-up.
// shared code, loaded once and kept in memory until the file changes
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const field = input?.field ?? "Locale";
const LIMIT = input?.limit ?? 6;
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const items = linksHere().where((p) => p.Type === "Itinerary" && here(p[field]) && p.Start
        && (p.End ? dv.date(p.End) >= now : dv.date(p.Start) >= now.startOf("day")))
    .sort((p) => dv.date(p.Start).toMillis(), "asc").array();
const ideas = linksHere().where((p) => p.Type === "Itinerary" && here(p[field]) && !p.Start).length;
const box = dv.el("div", "", { cls: "travel-plan" });
if (!items.length && !ideas) { (box.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? box.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden"); return; }
const L = await lib("itinLine").then((f) => f({ dv, app }));
box.createEl("strong", { text: "Coming Up" });
for (const p of items.slice(0, LIMIT)) {
    const s = dv.date(p.Start);
    const when = s.toFormat(s.hour || s.minute ? "ccc d LLL · HH:mm" : "ccc d LLL");
    const city = field === "Country" && p.Locale ? dv.page(p.Locale) : null;
    const showCity = city && L.target(p)?.file.path !== city.file.path;   // a stay in Kyoto already says Kyoto
    L.line(box, p, when, showCity ? ` <small>· ${city.file.name.replace(/,[^,]*$/, "")}</small>` : "");
}
if (items.length > LIMIT) box.createDiv({ cls: "travel-muted", text: `+ ${items.length - LIMIT} more` });
if (ideas) box.createDiv({ cls: "travel-muted", text: `${ideas} undated idea${ideas === 1 ? "" : "s"}` });
