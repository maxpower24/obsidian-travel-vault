// gaps.js — nights between Start and the night before End with no Stay (overnight transport counts)
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
// hide the surrounding box if the widget is in one, otherwise just this block (never a whole column)
const hideBox = (el) => (el.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? el.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden");
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const box = dv.el("div", "", { cls: "travel-gaps" });
if (!["Before", "During"].includes(t.phase)) { hideBox(box); return; }
box.createEl("strong", { text: "Gaps" });
if (!t.gaps.length) { box.createDiv({ text: "✓ Every night has a bed" }); return; }
const fmt = (k) => dv.date(k).toFormat("ccc d LLL");
const total = t.gaps.reduce((n, g) => n + g.count, 0);
box.createDiv({ cls: "travel-muted", text: `${total} night${total === 1 ? "" : "s"} with nowhere to stay` });
for (const g of t.gaps) box.createDiv({ cls: "travel-gap", text: `🛏️ ${fmt(g.from)}${g.count > 1 ? " – " + fmt(g.to) : ""} · ${g.count} night${g.count === 1 ? "" : "s"}` });
