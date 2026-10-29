// fx.js — exchange rate from the home currency. input: { codes: ["JPY", ...] }
// Shows the last saved rates immediately; refreshes in the background when the API says new rates are out.
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const cfg   = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const BASE  = cfg["Home Currency"] ?? "AUD";
const CODES = input?.codes ?? [];
const el = dv.el("div", "Loading exchange rate…");
const fmt = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: n < 10 ? 2 : 0 });
const draw = (data) => {
    if (!el.isConnected && el.parentElement === null) return;
    const lines = CODES.filter((c) => data.rates?.[c]).flatMap((c) => {
        const r = data.rates[c], unit = Math.pow(10, Math.max(0, Math.round(Math.log10(r))));
        return [`**1 ${BASE}** ≈ ${fmt(r)} ${c}`, `**${unit.toLocaleString("en-AU")} ${c}** ≈ ${fmt(unit / r)} ${BASE}`];
    });
    const day = new Date(data.time_last_update_unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
    el.empty();
    D.p(el, (lines.length ? lines.join("<br>") : "No rate for " + CODES.join(", ")) + `<br><small>Updated ${day}</small>`);
};
await (await lib("cache")).staleFirst({
    key: "travel-vault-fx2-" + BASE,
    isStale: (s) => Date.now() / 1000 > s.data.time_next_update_unix,
    fetcher: async () => { const json = await (await fetch("https://open.er-api.com/v6/latest/" + BASE)).json(); return json.result === "success" ? json : null; },
    draw,
    empty: () => el.setText("Exchange rate unavailable"),
});
