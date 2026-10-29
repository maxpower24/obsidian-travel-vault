// neighbourhoods.js — this locale's places grouped by their Area field
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const places = linksHere().where((p) => p.Type === "Place" && here(p.Locale) && p.Area);
if (!places.length) { D.p(dv.container, "Neighbourhoods appear once places have an Area"); return; }
const groups = places.groupBy((p) => p.Area).sort((g) => g.rows.length, "desc");
D.p(dv.container, groups.map((g) => `**${g.key}** · ${g.rows.sort((p) => p.file.name).map((p) => p.file.link).join(", ")}`).array().join("<br>"));
