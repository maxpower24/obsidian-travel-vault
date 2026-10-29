// stillToDo.js — "Yet to Visit": saved places here not visited yet; tick one to mark it visited (sets Visited + Last Visited).
// input: { field: "Locale" | "Country", limit: 8 }
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const linksHere = () => dv.pages(`[[${dv.current().file.path.replace(/\.md$/, "")}]]`);   // notes linking to this one (from the index, no vault scan)
const field = input?.field ?? "Locale";
const LIMIT = input?.limit ?? 8;
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const todo = linksHere().where((p) => p.Type === "Place" && here(p[field]) && !p.Visited)
    .sort((p) => p.Rating ?? 0, "desc");
const ICONS = (await lib("itinLine").then((f) => f({ dv, app }))).ICONS;
const iconFor = (place) => (place && (ICONS.types?.[place["Primary Type"]] ?? ICONS.groups?.[place.Group])) ?? ICONS.default;
const box = dv.el("div", "", { cls: "travel-todo" });
box.createEl("strong", { text: "Yet to Visit" });
if (!todo.length) { box.createDiv({ cls: "travel-muted", text: "Nothing saved that you haven't been to" }); return; }
const list = box.createDiv({ cls: "travel-todo-list" });
for (const p of todo.limit(LIMIT)) {
    const row = list.createEl("label", { cls: "travel-todo-row" });
    const tick = row.createEl("input", { type: "checkbox" });
    D.span(row.createSpan(), `${iconFor(p)} ${p.file.link}${p.Rating ? ` <small>★ ${p.Rating}</small>` : ""}`);
    tick.onchange = async () => {
        if (!tick.checked) return;
        const file = app.vault.getAbstractFileByPath(p.file.path);
        await app.fileManager.processFrontMatter(file, (fm) => { fm.Visited = true; fm["Last Visited"] = window.moment().format("YYYY-MM-DD"); });
        row.addClass("is-done");
        new Notice(`Marked ${p.file.name} as visited`);
    };
}
if (todo.length > LIMIT) box.createDiv({ cls: "travel-muted", text: `+ ${todo.length - LIMIT} more` });
