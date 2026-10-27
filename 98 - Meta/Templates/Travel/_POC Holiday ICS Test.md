<%*
/**
 * PROOF OF CONCEPT — Google Calendar public holiday feeds (ICS, no key) as a fallback.
 * Google calendar IDs aren't documented, so this tries several naming styles per country.
 * Writes _scripts/holiday-ics-test-output.json
 */
const OUT = "_scripts/holiday-ics-test-output.json";
const CANDIDATES = {
    TH: ["en.th", "en.thai"],
    TW: ["en.tw", "en.taiwan"],
    JP: ["en.jp", "en.japanese"],      // control: known-good country, to compare with Nager
};
const result = {};
const today = tp.date.now("YYYYMMDD");

function parseIcs(text) {
    const events = [];
    const unfolded = text.replace(/\r?\n[ \t]/g, "");           // ICS line folding
    for (const block of unfolded.split("BEGIN:VEVENT").slice(1)) {
        const get = (k) => (block.match(new RegExp(`^${k}[^:]*:(.*)$`, "m")) || [])[1]?.trim();
        events.push({ date: get("DTSTART"), summary: get("SUMMARY"), description: get("DESCRIPTION") });
    }
    return events;
}

for (const [cc, ids] of Object.entries(CANDIDATES)) {
    result[cc] = {};
    for (const id of ids) {
        const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(id + "#holiday@group.v.calendar.google.com")}/public/basic.ics`;
        try {
            const res = await tp.obsidian.requestUrl({ url, throw: false });
            if (res.status !== 200) { result[cc][id] = { status: res.status }; continue; }
            const events = parseIcs(res.text);
            const upcoming = events.filter((e) => e.date && e.date.slice(0, 8) >= today)
                                   .sort((a, b) => a.date.localeCompare(b.date));
            result[cc][id] = {
                status: 200,
                totalEvents: events.length,
                range: events.length ? [events.map((e) => e.date).sort()[0], events.map((e) => e.date).sort().pop()] : null,
                next: upcoming.slice(0, 5),
            };
        } catch (e) {
            result[cc][id] = { error: e.message };
        }
    }
}

await tp.app.vault.adapter.write(OUT, JSON.stringify(result, null, 2));
new Notice("Holiday ICS test done", 5000);
%>
