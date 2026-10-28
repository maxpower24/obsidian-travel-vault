// stillToDo.js — "Yet to Visit": saved places here not visited yet; tick one to mark it visited (sets Visited + Last Visited).
// input: { field: "Locale" | "Country", limit: 8 }
const field = input?.field ?? "Locale";
const LIMIT = input?.limit ?? 8;
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const todo = dv.pages().where((p) => p.Type === "Place" && here(p[field]) && !p.Visited)
    .sort((p) => p.Rating ?? 0, "desc");
let ICONS = { types: {}, groups: {}, subtypes: {}, default: "📍" };
try { ICONS = JSON.parse(await app.vault.adapter.read("98 - Meta/Views/Travel/placeIcons.json")); } catch (e) { console.error("placeIcons.json unreadable", e); }
const iconFor = (place, subtype) => (place && (ICONS.types[place["Primary Type"]] ?? ICONS.groups[place.Group]))
    ?? ICONS.subtypes[subtype] ?? ICONS.default;
const box = dv.el("div", "", { cls: "travel-todo" });
box.createEl("strong", { text: "Yet to Visit" });
if (!todo.length) { box.createDiv({ cls: "travel-muted", text: "Nothing saved that you haven't been to" }); return; }
const list = box.createDiv({ cls: "travel-todo-list" });
for (const p of todo.limit(LIMIT)) {
    const row = list.createEl("label", { cls: "travel-todo-row" });
    const tick = row.createEl("input", { type: "checkbox" });
    dv.span(`${iconFor(p)} ${p.file.link}${p.Rating ? ` <small>★ ${p.Rating}</small>` : ""}`, { container: row.createSpan() });
    tick.onchange = async () => {
        if (!tick.checked) return;
        const file = app.vault.getAbstractFileByPath(p.file.path);
        await app.fileManager.processFrontMatter(file, (fm) => { fm.Visited = true; fm["Last Visited"] = window.moment().format("YYYY-MM-DD"); });
        row.addClass("is-done");
        new Notice(`Marked ${p.file.name} as visited`);
    };
}
if (todo.length > LIMIT) box.createDiv({ cls: "travel-muted", text: `+ ${todo.length - LIMIT} more` });
