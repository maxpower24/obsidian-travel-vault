// todos.js — open tasks from any note in the trip folder except the packing list
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const pages = dv.pages(`"${trip.file.folder}"`).where((p) => p.Type !== "Packing List");
const open = (await dv.tasks(pages)).filter((x) => !x.completed);
D.p(dv.container, "**To-Dos**");
if (!open.length) { D.p(dv.container, "<small>Nothing to do. Add tasks to any note in this trip</small>"); return; }
const list = dv.el("div", "", { cls: "travel-todo-list" });
for (const t of open) {
    const row = list.createEl("label", { cls: "travel-todo-row" });
    const tick = row.createEl("input", { type: "checkbox" });
    D.span(row.createSpan(), `${t.text} <small>· [[${t.path}|${t.path.split("/").pop().replace(/\.md$/, "")}]]</small>`);
    tick.onchange = async () => { if (tick.checked) { row.addClass("is-done"); await dv.toggleTask(t, true); } };
}
