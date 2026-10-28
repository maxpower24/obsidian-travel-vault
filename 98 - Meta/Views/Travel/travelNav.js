/**
 * travelNav.js — Travel module rules for nav.js (named in Travel's _config as `Nav Rules`).
 * Breadcrumbs follow meaning, not folders:
 *   Country    Travel › Countries › Japan
 *   Locale     Travel › Countries › Japan › Tokyo
 *   Place      Travel › Countries › Japan › Tokyo › Senso-ji
 *   Trip       Travel › Trips › Christmas 2026
 *   Trip notes Travel › Trips › Christmas 2026 › 2026 - Senso-ji morning   (anything with a Trip link)
 * Right side: the trip happening today, as "Trip · Day N of M" (on every travel note but that trip).
 * Itinerary notes also get previous / next: dated itinerary notes of the same trip, in Start order.
 * Returns null for anything else, so nav.js falls back to the folder breadcrumb.
 */
module.exports = ({ dv, page, config, fn }) => {
    const DAY = 86400000;
    const pathOf  = (p) => p?.file?.path ?? null;
    const linkTo  = (p, label) => `[[${p.file.path}|${label ?? p.file.name}]]`;
    const crumb   = (p, label) => p && { path: p.file.path, label: label ?? p.file.name };
    const section = (key) => config[key] && { path: fn.folderNote(config[key]), label: fn.label(config[key]) };
    const country = fn.linkPage(page.Country);
    const cityName = (p) => p.file.name.replace(/,[^,]*$/, "");            // "Tokyo, Japan" → "Tokyo"
    const millis   = (d) => dv.date(d)?.startOf("day").toMillis();

    // ---- breadcrumb (between the module root and the note itself)
    let crumbs = null, current = null;
    if (page.Type === "Country") {
        crumbs = [section("Countries Folder")];
    } else if (page.Type === "Locale") {
        crumbs = [section("Countries Folder"), crumb(country)];
        current = cityName(page);
    } else if (page.Type === "Place") {
        const locale = fn.linkPage(page.Locale);
        crumbs = [section("Countries Folder"), crumb(country), locale && crumb(locale, cityName(locale))];
    } else if (page.Type === "Trip") {
        crumbs = [section("Trips Folder")];
    } else if (page.Trip) {
        crumbs = [section("Trips Folder"), crumb(fn.linkPage(page.Trip))];
    }
    if (crumbs) crumbs = crumbs.filter(Boolean);

    // ---- current trip (right side)
    const today = dv.date("today").toMillis();
    const active = dv.pages()
        .where((t) => t.Type === "Trip" && !t.Cancelled && t.Start
            && millis(t.Start) <= today && (!t.End || millis(t.End) >= today))
        .sort((t) => millis(t.Start), "asc")
        .first();
    let right = null;
    if (active && active.file.path !== page.file.path) {
        const day = Math.round((today - millis(active.Start)) / DAY) + 1;
        const of  = active.End ? ` of ${Math.round((millis(active.End) - millis(active.Start)) / DAY) + 1}` : "";
        right = `${linkTo(active)} · Day ${day}${of}`;
    }

    // ---- previous / next (dated itinerary notes of the same trip)
    let prev = null, next = null;
    const trip = fn.linkPage(page.Trip);
    if (page.Type === "Itinerary" && trip && page.Start) {
        const stops = dv.pages()
            .where((p) => p.Type === "Itinerary" && p.Start && pathOf(fn.linkPage(p.Trip)) === trip.file.path)
            .array()
            .sort((a, b) => dv.date(a.Start).toMillis() - dv.date(b.Start).toMillis() || a.file.name.localeCompare(b.file.name));
        const i = stops.findIndex((p) => p.file.path === page.file.path);
        if (i > 0) prev = linkTo(stops[i - 1]);
        if (i >= 0 && i < stops.length - 1) next = linkTo(stops[i + 1]);
    }

    return { crumbs, current, right, prev, next };
};
