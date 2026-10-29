// panel.js — renders several widgets inside ONE Dataview block (far cheaper than a block per widget).
// input: { widgets: [ "name" | { name, input } ], plain: false }
//   plain: false → each widget in its own bordered box (looks like [!col|box]); true → stacked, no boxes.
// Widget code is compiled once and kept in memory until its file changes (dv.view re-reads it from disk
// every time), and widgets run in parallel so a slow one (holidays, weather) doesn't hold up the others.
const BASE = "98 - Meta/Views/Travel";
const compiled = ((window.travelVault ??= {}).widgets ??= {});
const widget = async (name) => {
    const f = app.vault.getAbstractFileByPath(`${BASE}/${name}.js`);
    if (!f) throw new Error(`no widget "${name}"`);
    if (compiled[name]?.mtime !== f.stat.mtime) {
        compiled[name] = { mtime: f.stat.mtime, fn: new Function("dv", "input", `return (async () => {\n${await app.vault.cachedRead(f)}\n})();\n//# sourceURL=${f.path}`) };
    }
    return compiled[name].fn;
};
const items = (input?.widgets ?? []).map((w) => (typeof w === "string" ? { name: w } : w));
const wrap = dv.el("div", "", { cls: "travel-panel" + (input?.plain ? " is-plain" : "") });
await Promise.all(items.map(async (w) => {
    const box = wrap.createDiv({ cls: input?.plain ? "travel-panel-item" : "travel-box" });
    const sub = Object.create(dv);   // the same Dataview API, drawing into this box
    sub.container = box;
    try { await (await widget(w.name))(sub, w.input); }
    catch (e) { console.error(`panel: ${w.name} failed`, e); box.setText(`${w.name} failed: ${e.message}`); }
}));
