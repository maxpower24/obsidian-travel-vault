// status.js — status badge + next visit. input: { field: "Country" | "Locale" }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const field = input?.field ?? "Country";
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const itins  = linksHere().where((p) => p.Type === "Itinerary" && here(p[field]));
const places = linksHere().where((p) => p.Type === "Place" && here(p[field]));
const past     = itins.where((i) => i.End && dv.date(i.End) < now);
const upcoming = itins.where((i) => !i.End || dv.date(i.End) >= now);
const status = (past.length || places.where((p) => p.Visited).length) ? "Visited"
             : upcoming.length ? "Planned"
             : (cur.Wishlist || places.length) ? "Saved" : "Reference";
// next visit = earliest upcoming itinerary here (dated first), via its trip
const next = upcoming.sort((i) => i.Start ? dv.date(i.Start).toMillis() : Number.MAX_SAFE_INTEGER, "asc").first();
let nextText = "";
if (next) {
    const trip = next.Trip ? dv.page(next.Trip) : null;
    const start = next.Start ? dv.date(next.Start) : (trip?.Start ? dv.date(trip.Start) : null);
    const pl = next.Place ? dv.page(next.Place) : null;   // never link the itinerary note itself
    const name = trip ? `[[${trip.file.path}|${trip.file.name}]]` : pl ? pl.file.link : "a plan";
    if (start && start <= now) nextText = `Now · ${name}`;
    else if (start) nextText = `Next visit: ${name} · in ${Math.ceil(start.diff(now, "days").days)} days`;
    else nextText = `Next visit: ${name} · dates TBC`;
}
const el = dv.el("div", "", { cls: "travel-status-bar" });
D.p(el, `<span class="travel-status travel-status-${status.toLowerCase()}">${status}</span>${nextText ? " · " + nextText : ""}`);
