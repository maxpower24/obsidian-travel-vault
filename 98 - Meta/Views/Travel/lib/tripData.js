/**
 * tripData.js — everything the trip widgets need, worked out once from the trip's itinerary notes.
 * module.exports = (dv, trip) => { phase, start, end, today, days, nights, dayN, itins, dated, stays,
 *   transport, gaps, locales, countries, here, first }
 * Dates are compared as "YYYY-MM-DD" strings (local calendar days), which keeps time zones out of it.
 * Worked out once and shared by every widget on the note: the result is cached until Dataview's index
 * changes (any note edit) or the day changes.
 */
module.exports = (dv, trip) => {
    const rev = dv.revision ?? app.plugins.plugins.dataview?.index?.revision;   // Vault Views (or Dataview) change counter
    if (rev === undefined) return compute(dv, trip);   // can't tell when notes change: don't cache
    const cacheKey = `${trip.file.path}|${rev}|${dv.date("today").toISODate()}`;
    const cache = ((window.travelVault ??= {}).trips ??= {});
    if (cache[trip.file.path]?.key === cacheKey) return cache[trip.file.path].data;
    const data = compute(dv, trip);
    cache[trip.file.path] = { key: cacheKey, data };
    return data;
};

function compute(dv, trip) {
    const key  = (d) => (d ? dv.date(d)?.toISODate() : null);
    const add  = (k, n) => dv.date(k).plus({ days: n }).toISODate();
    const span = (a, b) => Math.round(dv.date(b).diff(dv.date(a), "days").days);
    const pathOf = (l) => (l ? dv.page(l)?.file.path ?? null : null);
    const today = dv.date("today").toISODate();

    // itinerary notes live in the trip's folder, so only that folder is read
    const itins = dv.pages(`"${trip.file.folder}"`).where((p) => p.Type === "Itinerary" && pathOf(p.Trip) === trip.file.path).array();
    const byStart = (a, b) => dv.date(a.Start).toMillis() - dv.date(b.Start).toMillis() || a.file.name.localeCompare(b.file.name);
    const dated = itins.filter((p) => p.Start).sort(byStart);
    const stays = dated.filter((p) => p.Subtype === "Stay");
    const transport = dated.filter((p) => p.Subtype === "Transport");

    const start = key(trip.Start), end = key(trip.End);
    const phase = trip.Cancelled ? "Cancelled" : !start ? "Idea"
                : today < start ? "Before" : end && today > end ? "After" : "During";
    const days = start && end ? span(start, end) + 1 : null;

    // nights that need a bed: Start .. the night before End (End is the day you fly home)
    const nights = [];
    if (start && end) for (let k = start; k < end; k = add(k, 1)) nights.push(k);
    const covered = new Set();
    for (const p of [...stays, ...transport]) {
        const s = key(p.Start), e = key(p.End);
        if (p.Subtype === "Stay") { const last = e && e > s ? e : add(s, 1); for (let k = s; k < last; k = add(k, 1)) covered.add(k); }
        else if (e && e > s) for (let k = s; k < e; k = add(k, 1)) covered.add(k);   // overnight train, ferry, flight
    }
    const gaps = [];
    for (const k of nights.filter((n) => !covered.has(n))) {
        const g = gaps[gaps.length - 1];
        if (g && add(g.to, 1) === k) { g.to = k; g.count++; } else gaps.push({ from: k, to: k, count: 1 });
    }

    // cities and countries in order of first appearance
    const uniq = (list) => { const seen = new Set(); return list.filter((p) => p && !seen.has(p.file.path) && seen.add(p.file.path)); };
    const localeOf = (p) => (p.Locale ? dv.page(p.Locale) : p.Subtype === "Transport" && p.To ? dv.page(p.To) : null);
    const locales = uniq([...dated, ...itins.filter((p) => !p.Start)].map((p) => {
        const l = localeOf(p); return l?.Type === "Locale" ? l : (p.Locale ? dv.page(p.Locale) : null);
    }));
    const countries = uniq([...dated, ...itins.filter((p) => !p.Start)].map((p) => (p.Country ? dv.page(p.Country) : null)));

    // where you are: today's stay during the trip, else the first stay
    const stayOn = (k) => stays.find((p) => key(p.Start) <= k && (key(p.End) ?? add(key(p.Start), 1)) > k);
    const nowStay = phase === "During" ? stayOn(today) ?? stays.filter((p) => key(p.Start) <= today).pop() : null;
    const here  = nowStay ? (nowStay.Locale ? dv.page(nowStay.Locale) : null) : null;
    const first = stays[0] ? (stays[0].Locale ? dv.page(stays[0].Locale) : null) : locales[0] ?? null;
    const dayN = phase === "During" ? span(start, today) + 1 : null;

    return { phase, start, end, today, days, nights, dayN, itins, dated, stays, transport, gaps, locales, countries, here, first, key, add, span };
}
