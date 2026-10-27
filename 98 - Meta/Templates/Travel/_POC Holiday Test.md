<%*
/**
 * PROOF OF CONCEPT — Nager.Date public holiday API (no key).
 * Writes _scripts/holiday-test-output.json:
 *   - which test countries are supported
 *   - next public holidays per country
 *   - full 2026 + 2027 list for JP (covers the Christmas trip)
 */
const OUT  = "_scripts/holiday-test-output.json";
const BASE = "https://date.nager.at/api/v3";
const TEST = ["JP", "AU", "GB", "FR", "KR", "VN", "TH", "ID", "NZ", "US", "SG", "TW"];
const http = tp.user.sysHttp(tp);
const result = { supported: {}, next: {}, JP_2026: null, JP_2027: null };

try {
    const avail = await http.requestJson({ url: `${BASE}/AvailableCountries` });
    const codes = new Set((avail.json ?? []).map((c) => c.countryCode));
    result.availableCount = codes.size;
    for (const cc of TEST) result.supported[cc] = codes.has(cc);

    for (const cc of TEST.filter((c) => result.supported[c])) {
        const r = await http.requestJson({ url: `${BASE}/NextPublicHolidays/${cc}` });
        result.next[cc] = { status: r.status, holidays: (r.json ?? []).slice(0, 3) };
    }
    for (const y of [2026, 2027]) {
        const r = await http.requestJson({ url: `${BASE}/PublicHolidays/${y}/JP` });
        result[`JP_${y}`] = { status: r.status, holidays: r.json };
    }
} catch (e) {
    result.error = e.message;
}

await tp.app.vault.adapter.write(OUT, JSON.stringify(result, null, 2));
new Notice(result.error ? `Holiday test failed: ${result.error}` : "Holiday test done", 6000);
%>
