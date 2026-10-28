// trips.js — trips with an itinerary note here, newest first. input: { field: "Country" | "Locale" }
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
const trips = dv.pages().where((p) => p.Type === "Itinerary" && here(p[field]) && p.Trip)
    .map((i) => dv.page(i.Trip)).filter((t) => t && !seen.has(t.file.path) && seen.add(t.file.path))
    .sort((t) => t.Start ? dv.date(t.Start).toMillis() : 0, "desc");
if (!trips.length) dv.paragraph("No trips yet");
else dv.paragraph(trips.map((t) => {
    const range = t.Start ? `${dv.date(t.Start).toFormat("d MMM yyyy")}${t.End ? " – " + dv.date(t.End).toFormat("d MMM yyyy") : ""}` : "dates TBC";
    return `${t.file.link} · ${range} · ${tripStatus(t)}`;
}).join("<br>"));
