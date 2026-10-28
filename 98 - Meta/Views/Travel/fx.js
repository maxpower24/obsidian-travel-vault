// fx.js — exchange rate from the home currency. input: { codes: ["JPY", ...] }
const cfg   = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const BASE  = cfg["Home Currency"] ?? "AUD";
const CODES = input?.codes ?? [];
const KEY   = "travel-vault-fx-" + BASE;
const el = dv.el("div", "Loading exchange rate…");
let data = null;
try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
const fresh = data && Date.now() / 1000 < data.time_next_update_unix;
if (!fresh) {
    try {
        const res = await fetch("https://open.er-api.com/v6/latest/" + BASE);
        const json = await res.json();
        if (json.result === "success") { data = json; localStorage.setItem(KEY, JSON.stringify(json)); }
    } catch (e) { console.error("FX fetch failed", e); }
}
if (!data?.rates) { el.setText("Exchange rate unavailable"); return; }
const fmt = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: n < 10 ? 2 : 0 });
const lines = CODES.filter((c) => data.rates[c]).flatMap((c) => {
    const r = data.rates[c], unit = Math.pow(10, Math.max(0, Math.round(Math.log10(r))));
    return [`**1 ${BASE}** ≈ ${fmt(r)} ${c}`, `**${unit.toLocaleString("en-AU")} ${c}** ≈ ${fmt(unit / r)} ${BASE}`];
});
const day = new Date(data.time_last_update_unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
el.empty();
dv.paragraph((lines.length ? lines.join("<br>") : "No rate for " + CODES.join(", ")) + `<br><small>Updated ${day}</small>`, { container: el });
