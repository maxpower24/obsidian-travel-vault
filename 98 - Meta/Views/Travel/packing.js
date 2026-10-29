// packing.js — progress of the trip's packing list, plus a button that adds anything missing from
// the baseline list and each trip country's Routine Packing List.
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
// hide the surrounding box if the widget is in one, otherwise just this block (never a whole column)
const hideBox = (el) => (el.closest('.travel-box, .travel-panel-item, .callout[data-callout="col"][data-callout-metadata~="box"]') ?? el.closest(".block-language-view, .block-language-dataviewjs"))?.addClass("travel-hidden");
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const box = dv.el("div", "", { cls: "travel-packing" });
if (["After", "Cancelled"].includes(t.phase)) { hideBox(box); return; }
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const tripPath = trip.file.path;
const note = dv.pages(`"${trip.file.folder}"`).where((p) => p.Type === "Packing List" && p.Trip && dv.page(p.Trip)?.file.path === tripPath).first();
const tasks = note ? await dv.tasks(note) : [];
const done = tasks.filter((x) => x.completed).length;
const head = box.createDiv({ cls: "travel-packing-head" });
D.span(head.createSpan(), note ? `**[[${note.file.path}|Packing]]**` : "**Packing**");
head.createSpan({ cls: "travel-muted", text: tasks.length ? ` ${done} / ${tasks.length}` : "" });
const meter = box.createDiv({ cls: "travel-meter" });
meter.createDiv({ cls: "travel-meter-fill" }).style.width = `${tasks.length ? Math.round((done / tasks.length) * 100) : 0}%`;
const btn = box.createEl("button", { cls: "travel-small-button", text: note ? "Refresh Packing" : "Create Packing List" });
btn.onclick = async () => {
    const want = [];
    const base = cfg["Packing Baseline"] ? dv.page(cfg["Packing Baseline"]) : null;
    if (base) want.push(...(await dv.tasks(base)).map((x) => x.text.trim()));
    for (const c of t.countries) want.push(...[].concat(c.Packing ?? []).map(String));
    const have = new Set(tasks.map((x) => x.text.trim().toLowerCase()));
    const missing = [...new Set(want.filter((w) => w && !have.has(w.toLowerCase())))];
    let file = note ? app.vault.getAbstractFileByPath(note.file.path) : null;
    if (!file) {
        const folder = trip.file.folder;
        file = await app.vault.create(`${folder}/Packing - ${trip.file.name}.md`, `---\nType: Packing List\nTrip: "[[${trip.file.name}]]"\n---\n\`\`\`nav\n\`\`\`\n`);
    }
    if (missing.length) await app.vault.process(file, (s) => s.replace(/\n*$/, "\n") + missing.map((m) => `- [ ] ${m}`).join("\n") + "\n");
    new Notice(missing.length ? `Added ${missing.length} item${missing.length === 1 ? "" : "s"} to packing` : "Packing list already has everything");
};
