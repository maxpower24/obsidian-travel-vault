// trips.js — trips with an itinerary note here, newest first. input: { field: "Country" | "Locale" }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const field = input?.field ?? "Country";
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const tripStatus = (t) => {
    if (t.Cancelled) return "Cancelled";
    if (!t.Start) return "Idea";
    if (t.End && dv.date(t.End) < now) return "Done";
    if (dv.date(t.Start) <= now) return "Active";
    return t.Booked ? "Booked" : "Planning";
};
const seen = new Set();
const trips = linksHere().where((p) => p.Type === "Itinerary" && here(p[field]) && p.Trip)
    .map((i) => dv.page(i.Trip)).filter((t) => t && !seen.has(t.file.path) && seen.add(t.file.path))
    .sort((t) => t.Start ? dv.date(t.Start).toMillis() : 0, "desc");
if (input?.title) D.p(dv.container, `**${input.title}**`);
if (!trips.length) D.p(dv.container, "No trips yet");
else D.p(dv.container, trips.map((t) => {
    const range = t.Start ? `${dv.date(t.Start).toFormat("d MMM yyyy")}${t.End ? " – " + dv.date(t.End).toFormat("d MMM yyyy") : ""}` : "dates TBC";
    return `${t.file.link} · ${range} · ${tripStatus(t)}`;
}).join("<br>"));
