// nearby.js — other Cities & Regions within the configured radius, by Coordinates
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const RADIUS = Number(cfg["Nearby Radius km"] ?? 150);
const cur = dv.current();
const ll = (v) => { const p = String(v ?? "").split(",").map(Number); return p.length === 2 && p.every(Number.isFinite) ? p : null; };
const me = ll(cur.Coordinates);
if (!me) { D.p(dv.container, "No coordinates yet"); return; }
const rad = (x) => (x * Math.PI) / 180;
const km = ([a1, o1], [a2, o2]) => {
    const h = Math.sin(rad(a2 - a1) / 2) ** 2 + Math.cos(rad(a1)) * Math.cos(rad(a2)) * Math.sin(rad(o2 - o1) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
};
const near = dv.pages(`"${cfg["Locales Folder"] ?? "05 - Areas/Travel/Cities & Regions"}"`).where((p) => p.Type === "Locale" && p.file.path !== cur.file.path && ll(p.Coordinates))
    .map((p) => ({ p, d: km(me, ll(p.Coordinates)) })).where((x) => x.d <= RADIUS).sort((x) => x.d, "asc");
if (!near.length) { D.p(dv.container, `None within ${RADIUS} km yet`); return; }
D.p(dv.container, near.map((x) => `[[${x.p.file.path}|${x.p.file.name.replace(/,[^,]*$/, "")}]] · ${Math.round(x.d)} km`).array().join("<br>"));
