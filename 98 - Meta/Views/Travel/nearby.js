// nearby.js — other Cities & Regions within the configured radius, by Coordinates
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const RADIUS = Number(cfg["Nearby Radius km"] ?? 150);
const cur = dv.current();
const ll = (v) => { const p = String(v ?? "").split(",").map(Number); return p.length === 2 && p.every(Number.isFinite) ? p : null; };
const me = ll(cur.Coordinates);
if (!me) { dv.paragraph("No coordinates yet"); return; }
const rad = (x) => (x * Math.PI) / 180;
const km = ([a1, o1], [a2, o2]) => {
    const h = Math.sin(rad(a2 - a1) / 2) ** 2 + Math.cos(rad(a1)) * Math.cos(rad(a2)) * Math.sin(rad(o2 - o1) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
};
const near = dv.pages().where((p) => p.Type === "Locale" && p.file.path !== cur.file.path && ll(p.Coordinates))
    .map((p) => ({ p, d: km(me, ll(p.Coordinates)) })).where((x) => x.d <= RADIUS).sort((x) => x.d, "asc");
if (!near.length) { dv.paragraph(`None within ${RADIUS} km yet`); return; }
dv.paragraph(near.map((x) => `[[${x.p.file.path}|${x.p.file.name.replace(/,[^,]*$/, "")}]] · ${Math.round(x.d)} km`).array().join("<br>"));
