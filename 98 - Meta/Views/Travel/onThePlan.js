// onThePlan.js — "Coming Up": upcoming dated itinerary notes here, soonest first. Hidden when nothing is planned.
// input: { field: "Locale" | "Country", limit: 6 } — on a country note each line also names its city
const field = input?.field ?? "Locale";
const LIMIT = input?.limit ?? 6;
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const items = dv.pages().where((p) => p.Type === "Itinerary" && here(p[field]) && p.Start
        && (p.End ? dv.date(p.End) >= now : dv.date(p.Start) >= now.startOf("day")))
    .sort((p) => dv.date(p.Start).toMillis(), "asc");
const ideas = dv.pages().where((p) => p.Type === "Itinerary" && here(p[field]) && !p.Start).length;
const box = dv.el("div", "", { cls: "travel-plan" });
// hide the whole surrounding box when there's nothing to show
if (!items.length && !ideas) { box.closest(".callout")?.addClass("travel-hidden"); return; }
box.createEl("strong", { text: "Coming Up" });
let ICONS = { types: {}, groups: {}, subtypes: {}, default: "📍" };
try { ICONS = JSON.parse(await app.vault.adapter.read("98 - Meta/Views/Travel/placeIcons.json")); } catch (e) { console.error("placeIcons.json unreadable", e); }
const iconFor = (place, subtype) => (place && (ICONS.types[place["Primary Type"]] ?? ICONS.groups[place.Group]))
    ?? ICONS.subtypes[subtype] ?? ICONS.default;
const lines = items.limit(LIMIT).map((p) => {
    const s = dv.date(p.Start);
    const when = s.toFormat(s.hour || s.minute ? "ccc d LLL · HH:mm" : "ccc d LLL");
    const place = p.Place ? dv.page(p.Place) : null;
    const what = place ? `[[${place.file.path}|${place.file.name}]]` : p.file.link;
    const city = field === "Country" && p.Locale ? dv.page(p.Locale) : null;
    const where = city ? ` <small>· ${city.file.name.replace(/,[^,]*$/, "")}</small>` : "";
    return `${iconFor(place, p.Subtype)} ${when} · ${what}${where}`;
}).array();
if (items.length > LIMIT) lines.push(`<small>+ ${items.length - LIMIT} more</small>`);
if (ideas) lines.push(`<small>${ideas} undated idea${ideas === 1 ? "" : "s"}</small>`);
dv.paragraph(lines.join("<br>"), { container: box });
