// localTime.js — live clock compared with home. input: { tz: "Asia/Tokyo", place: "Tokyo" }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const cfg   = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const HOME  = cfg["Home Timezone"] ?? "Australia/Melbourne";
const HOME_NAME = cfg["Home City"] ?? HOME;
const TZ    = input?.tz;
const PLACE = input?.place ?? "";
if (!TZ) { D.p(dv.container, "Local time unavailable"); return; }
const off = (tz, d) => {
    const v = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName").value;
    const m = v.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!m) return 0;
    const n = +m[2] * 60 + +(m[3] || 0);
    return m[1] === "-" ? -n : n;
};
const el = dv.el("div", "");
const render = () => {
    const now = new Date();
    const t = now.toLocaleTimeString("en-AU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
    const d = now.toLocaleDateString("en-AU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
    const diff = off(TZ, now) - off(HOME, now), h = Math.abs(diff) / 60;
    const rel = diff === 0 ? `same as ${HOME_NAME}` : `${Number.isInteger(h) ? h : h.toFixed(1)} h ${diff > 0 ? "ahead of" : "behind"} ${HOME_NAME}`;
    el.innerHTML = `<div style="font-size:1.8em;font-weight:600;line-height:1.1">${t}</div><div>${PLACE} · ${d}</div><small>${rel}</small>`;
};
render();
const timer = setInterval(() => { if (!el.isConnected) clearInterval(timer); else render(); }, 30000);
