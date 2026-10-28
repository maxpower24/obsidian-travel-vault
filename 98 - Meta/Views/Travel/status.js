// status.js — status badge + next visit. input: { field: "Country" | "Locale" }
const field = input?.field ?? "Country";
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const itins  = dv.pages().where((p) => p.Type === "Itinerary" && here(p[field]));
const places = dv.pages().where((p) => p.Type === "Place" && here(p[field]));
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
    const name = trip ? `[[${trip.file.path}|${trip.file.name}]]` : next.file.link;
    if (start && start <= now) nextText = `Now · ${name}`;
    else if (start) nextText = `Next visit: ${name} · in ${Math.ceil(start.diff(now, "days").days)} days`;
    else nextText = `Next visit: ${name} · dates TBC`;
}
const el = dv.el("div", "", { cls: "travel-status-bar" });
dv.paragraph(`<span class="travel-status travel-status-${status.toLowerCase()}">${status}</span>${nextText ? " · " + nextText : ""}`, { container: el });
