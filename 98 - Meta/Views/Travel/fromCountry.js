// fromCountry.js — the country's essentials shown on a city note (read live from the country note)
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const cur = dv.current();
const c = cur.Country ? dv.page(cur.Country) : null;
const box = dv.el("div", "", { cls: "travel-from-country" });
if (!c) { box.setText("No country note linked"); return; }
D.p(box, `**From** ${c.file.link}`);
const list = (v) => (Array.isArray(v) ? v.join(", ") : v) || "—";
D.p(box, [
    `**Plugs** ${list(c.Plugs)}`,
    `**Emergency** ${c["Emergency Number"] || "—"}`,
    `**Tipping** ${c.Tipping || "—"}`,
].join("<br>"));
const codes = c["Currency Codes"] ?? [];
if (codes.length) await dv.view("98 - Meta/Views/Travel/fx", { codes: Array.isArray(codes) ? codes : [codes] });
