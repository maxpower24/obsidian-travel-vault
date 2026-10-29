// holidays.js — next public holidays (Nager.Date, Google Calendar fallback). input: { cc: "JP" }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const CC  = input?.cc;
const GOOGLE_IDS = Object.fromEntries((cfg["Holiday Calendars"] ?? [])
    .map((s) => String(s).split(":").map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]));
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
// trip windows in this country, for highlighting
const windows = linksHere().where((p) => p.Type === "Itinerary" && here(p.Country) && p.Trip)
    .map((i) => dv.page(i.Trip)).filter((t) => t && t.Start && t.End)
    .map((t) => ({ name: t.file.name, start: dv.date(t.Start).toISODate(), end: dv.date(t.End).toISODate() })).array();
if (input?.title) D.p(dv.container, `**${input.title}**`);
const el = dv.el("div", "Loading…");
const fetcher = async () => {
    let list = [];
    try {
        const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${CC}`);
        if (res.ok) list = (await res.json()).filter((h) => h.global).map((h) => ({ date: h.date, name: h.name }));
    } catch (e) {}
    if (!list.length && GOOGLE_IDS[CC]) {
        try {
            const id = encodeURIComponent(GOOGLE_IDS[CC] + "#holiday@group.v.calendar.google.com");
            const txt = await (await fetch(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`)).text();
            const today = new Date().toISOString().slice(0, 10);
            list = txt.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1).map((b) => {
                const g = (k) => (b.match(new RegExp(`^${k}[^:]*:(.*)$`, "m")) || [])[1]?.trim() ?? "";
                const d = g("DTSTART");
                return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: g("SUMMARY"), pub: g("DESCRIPTION").startsWith("Public holiday") };
            }).filter((h) => h.pub && h.date >= today).sort((a, b) => a.date.localeCompare(b.date));
        } catch (e) {}
    }
    return list.length ? list : null;
};
const inTrip = (d) => windows.find((w) => d >= w.start && d <= w.end);
const fmt = (d) => new Date(d + "T00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
const draw = (all) => {
    el.empty();
    const today = new Date().toISOString().slice(0, 10);
    const list = all.filter((h) => h.date >= today);   // saved lists age; drop holidays that have passed
    if (!list.length) { el.setText("No holiday data"); return; }
    const shown = [...list.slice(0, 3), ...list.slice(3).filter((h) => inTrip(h.date))];
    D.p(el, shown.map((h) => { const t = inTrip(h.date); return `${fmt(h.date)} · ${h.name}${t ? ` <small>(during ${t.name})</small>` : ""}`; }).join("<br>"));
};
// shows the saved list immediately and refreshes it in the background once a day
await (await lib("cache")).staleFirst({ key: `travel-vault-nexthol-${CC}`, maxAgeMs: 864e5, fetcher, draw, empty: () => el.setText("No holiday data") });
