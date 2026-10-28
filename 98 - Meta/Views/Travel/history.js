// history.js — places saved / visited, last visited, and optionally where you've stayed.
// input: { field: "Country" | "Locale", stays: true|false }
const field = input?.field ?? "Country";
const cur = dv.current();
const isHere = (l) => l && dv.page(l)?.file.path === cur.file.path;
const places = dv.pages().where((p) => p.Type === "Place" && isHere(p[field]));
const itins  = dv.pages().where((p) => p.Type === "Itinerary" && isHere(p[field]));
const now = dv.date("now");
const dates = [
    ...places.where((p) => p.Visited && p["Last Visited"]).map((p) => dv.date(p["Last Visited"])).array(),
    ...itins.where((i) => i.End && dv.date(i.End) < now).map((i) => dv.date(i.End)).array(),
].filter(Boolean).sort((a, b) => b - a);
dv.paragraph([
    `**Places saved** ${places.length}`,
    `**Places visited** ${places.where((p) => p.Visited).length}`,
    `**Last visited** ${dates.length ? dates[0].toFormat("MMM yyyy") : "never"}`,
].join("<br>"));

// ---- Where I've Stayed: past Stay itineraries here, plus visited Stay places not covered by one
if (input?.stays) {
    const stays = itins.where((i) => i.Subtype === "Stay" && i.Start && (!i.End || dv.date(i.End) < now))
        .sort((i) => dv.date(i.Start).toMillis(), "desc");
    const covered = new Set(stays.map((i) => i.Place && dv.page(i.Place)?.file.path).filter(Boolean).array());
    const extra = places.where((p) => p.Group === "Stay" && p.Visited && !covered.has(p.file.path));
    const lines = [
        ...stays.map((i) => {
            const pl = i.Place ? dv.page(i.Place) : null;
            return `${pl ? pl.file.link : i.file.link} · ${dv.date(i.Start).toFormat("LLL yyyy")}`;
        }).array(),
        ...extra.map((p) => `${p.file.link}${p["Last Visited"] ? " · " + dv.date(p["Last Visited"]).toFormat("LLL yyyy") : ""}`).array(),
    ];
    dv.paragraph(`**Where I've Stayed**<br>${lines.length ? lines.join("<br>") : "<small>Nowhere yet</small>"}`);
}
