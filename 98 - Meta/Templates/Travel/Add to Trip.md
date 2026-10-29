<%*
/**
 * Add to Trip — run by the "Add to Trip" button on a place, city or trip note (Meta Bind runTemplaterFile).
 * Creates an itinerary note in the trip's folder with Trip, Place, Locale, Country and location filled in.
 *   Place note → pick a trip; Stay / Meal / Activity guessed from the place's Group
 *   City note  → pick a trip; a Stay by default
 *   Trip note  → this trip; choose Stay / Activity / Meal / Transport and what it's for
 * Dates are optional: leave them blank and it becomes an idea ("Idea - …"). Edit later with ✏️.
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
const cfg  = tp.user.sysConfig(tp).loadConfig(CONFIG_PATH);
const NAV  = "98 - Meta/Views/nav";
const app  = tp.app;
const fmOf = (f) => app.metadataCache.getFileCache(f)?.frontmatter ?? {};
const unlink = (v) => String(v ?? "").replace(/^\[\[|\]\]$/g, "").split("|")[0];
const fileOf = (v, from = "") => (v ? app.metadataCache.getFirstLinkpathDest(unlink(v), from) : null);
const short = (n) => String(n).replace(/,[^,]*$/, "");
const ask = async (label, def = "") => { const v = await tp.system.prompt(label, def); return v === null ? null : v.trim(); };
const askDate = async (label) => {
    while (true) {
        const v = await ask(`${label} (YYYY-MM-DD, blank = not decided)`);
        if (v === null) return null;
        if (v === "" || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)))) return v;
        new Notice("Use the format YYYY-MM-DD, e.g. 2026-12-20");
    }
};
const askTime = async (label) => {
    while (true) {
        const v = await ask(`${label} (HH:mm, blank = no time)`);
        if (v === null) return null;
        if (v === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return v;
        new Notice("Use 24-hour HH:mm, e.g. 08:30");
    }
};

const active = app.workspace.getActiveFile();
const kind = active ? fmOf(active).Type : null;
if (!["Place", "Locale", "Trip"].includes(kind)) { new Notice("Open a place, city or trip note first."); return; }
const all = app.vault.getMarkdownFiles();

// ---- which trip
let trip = kind === "Trip" ? active : null;
if (!trip) {
    const today = tp.date.now("YYYY-MM-DD");
    const trips = all.filter((f) => { const fm = fmOf(f); return fm.Type === "Trip" && !fm.Cancelled && (!fm.End || String(fm.End).slice(0, 10) >= today); })
        .sort((a, b) => String(fmOf(a).Start ?? "9999").localeCompare(String(fmOf(b).Start ?? "9999")));
    if (!trips.length) { new Notice("No upcoming trips. Create one with New Trip first."); return; }
    trip = await tp.system.suggester(trips.map((f) => `${f.basename}${fmOf(f).Start ? " · " + String(fmOf(f).Start).slice(0, 10) : " · dates TBC"}`), trips, false, "Add to which trip?");
    if (!trip) return;
}

// ---- what kind of item
const groupGuess = { Stay: "Stay", Food: "Meal", Cafe: "Meal", Bar: "Meal", Pub: "Meal" };
const order = (first) => [first, ...["Stay", "Activity", "Meal", "Transport"].filter((s) => s !== first)];
const choices = kind === "Place" ? order(groupGuess[fmOf(active).Group] ?? "Activity").filter((s) => s !== "Transport")
              : kind === "Locale" ? order("Stay").filter((s) => s !== "Transport")
              : order("Activity");
const subtype = await tp.system.suggester(choices, choices, false, "What is it?");
if (!subtype) return;

// ---- what it's for
let place = kind === "Place" ? active : null;
let locale = kind === "Locale" ? active : null;
const fm = { Type: "Itinerary", Subtype: subtype, Trip: `[[${trip.basename}]]` };
const stops = all.filter((f) => ["Locale", "Place"].includes(fmOf(f).Type)).sort((a, b) => a.basename.localeCompare(b.basename));
if (kind === "Trip" && subtype !== "Transport") {
    const pool = all.filter((f) => ["Place", "Locale"].includes(fmOf(f).Type)).sort((a, b) => a.basename.localeCompare(b.basename));
    const pick = await tp.system.suggester(pool.map((f) => `${fmOf(f).Type === "Place" ? "📍" : "🏙️"} ${f.basename}`), pool, false, "Which place or city?");
    if (!pick) return;
    if (fmOf(pick).Type === "Place") place = pick; else locale = pick;
}
if (place) {
    const pf = fmOf(place);
    locale = fileOf(pf.Locale, place.path) ?? locale;
    fm.Place = `[[${place.basename}]]`;
    if (pf.location) fm.location = pf.location;
}
if (locale) {
    fm.Locale = `[[${locale.basename}]]`;
    if (!fm.location && fmOf(locale).Coordinates) fm.location = fmOf(locale).Coordinates;
}
const src = place ?? locale;
const country = src ? fileOf(fmOf(src).Country ?? (locale ? fmOf(locale).Country : null), src.path) : null;
if (country) fm.Country = `[[${country.basename}]]`;

// ---- dates
let what = place ? place.basename : locale ? short(locale.basename) : "";
if (subtype === "Transport") {
    const modes = ["Flight", "Train", "Bus", "Ferry", "Cruise", "Car"];
    fm.Mode = await tp.system.suggester(modes, modes, false, "Mode");
    if (!fm.Mode) return;
    const from = await tp.system.suggester(stops.map((f) => f.basename), stops, false, "From (Esc = not in the vault)");
    const to   = await tp.system.suggester(stops.map((f) => f.basename), stops, false, "To (Esc = not in the vault)");
    if (from) fm.From = `[[${from.basename}]]`;
    if (to) {
        fm.To = `[[${to.basename}]]`;
        const tf = fmOf(to);
        if (tf.Type === "Locale") { fm.Locale = fm.To; if (tf.Country) fm.Country = `[[${unlink(tf.Country)}]]`; if (tf.Coordinates) fm.location = tf.Coordinates; }
    }
    const service = await ask("Service, e.g. JL 772 or Nozomi 23 (optional)");
    if (service) fm.Service = service;
    what = `${short(from?.basename ?? "?")} to ${short(to?.basename ?? "?")}`;
}
if (subtype === "Stay") {
    const inD = await askDate("Check-in date"); if (inD === null) return;
    const outD = inD ? await askDate("Check-out date") : ""; if (outD === null) return;
    if (inD) fm.Start = inD; if (outD) fm.End = outD;
} else {
    const d = await askDate(subtype === "Transport" ? "Departure date" : "Date"); if (d === null) return;
    if (d) {
        const t = await askTime(subtype === "Transport" ? "Departure time" : "Start time"); if (t === null) return;
        fm.Start = t ? `${d}T${t}` : d;
        if (subtype === "Transport") {
            const ad = await askDate("Arrival date (blank = same day)"); if (ad === null) return;
            const at = await askTime("Arrival time"); if (at === null) return;
            if (at || ad) fm.End = `${ad || d}${at ? "T" + at : ""}`;
        }
    }
}

// ---- create it
const folder = trip.parent.path;
const base = tp.user.sysString(tp).sanitiseFileName(`${fm.Start ? String(fm.Start).slice(0, 10) : "Idea"} - ${what || subtype}`);
let path = `${folder}/${base}.md`, n = 2;
while (app.vault.getAbstractFileByPath(path)) path = `${folder}/${base} (${n++}).md`;
const yaml = Object.entries(fm).map(([k, v]) => `${k}: ${/^\d{4}-\d{2}-\d{2}/.test(String(v)) || typeof v === "boolean" ? v : JSON.stringify(v)}`).join("\n");
await app.vault.create(path, `---\n${yaml}\n---\n\`\`\`nav\n\`\`\`\n`);
new Notice(`Added to ${trip.basename}: ${base}`, 6000);
%>
