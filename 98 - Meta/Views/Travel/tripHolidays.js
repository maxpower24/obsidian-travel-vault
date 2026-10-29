// tripHolidays.js — public holidays that fall inside the trip dates, for each country on the trip
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
// hide the surrounding box if the widget is in one, otherwise just this block (never a whole column)
const hideBox = (el) => (el.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? el.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden");
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const box = dv.el("div", "", { cls: "travel-holidays" });
if (!t.start || !t.end || t.phase === "Cancelled") { hideBox(box); return; }
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const GOOGLE_IDS = Object.fromEntries((cfg["Holiday Calendars"] ?? []).map((s) => String(s).split(":").map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]));
box.createEl("strong", { text: "Holidays During Trip" });
const list = box.createDiv({ text: "Loading…" });
const years = [...new Set([t.start.slice(0, 4), t.end.slice(0, 4)])];
const cached = async (k, fn) => {
    try { const c = JSON.parse(localStorage.getItem(k)); if (c && Date.now() - c.saved < 7 * 864e5) return c.data; } catch (e) {}
    const data = await fn(); try { localStorage.setItem(k, JSON.stringify({ saved: Date.now(), data })); } catch (e) {} return data;
};
const found = [];
for (const c of t.countries) {
    const cc = c["Country Code"]; if (!cc) continue;
    let all = [];
    for (const y of years) all.push(...await cached(`travel-vault-hol-${cc}-${y}`, async () => {
        try { const r = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${y}/${cc}`); if (r.ok) return (await r.json()).filter((h) => h.global).map((h) => ({ date: h.date, name: h.name })); } catch (e) {}
        return [];
    }));
    if (!all.length && GOOGLE_IDS[cc]) {
        try {
            const id = encodeURIComponent(GOOGLE_IDS[cc] + "#holiday@group.v.calendar.google.com");
            const txt = await (await fetch(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`)).text();
            all = txt.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1).map((b) => {
                const g = (k) => (b.match(new RegExp(`^${k}[^:]*:(.*)$`, "m")) || [])[1]?.trim() ?? "";
                const d = g("DTSTART");
                return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: g("SUMMARY"), pub: g("DESCRIPTION").startsWith("Public holiday") };
            }).filter((h) => h.pub);
        } catch (e) {}
    }
    found.push(...all.filter((h) => h.date >= t.start && h.date <= t.end).map((h) => ({ ...h, country: c.file.name })));
}
list.empty();
if (!found.length) { list.addClass("travel-muted"); list.setText("None during the trip"); return; }
const multi = t.countries.length > 1;
found.sort((a, b) => a.date.localeCompare(b.date));
for (const h of found) list.createDiv({ text: `${dv.date(h.date).toFormat("ccc d LLL")} · ${h.name}${multi ? ` (${h.country})` : ""}` });
