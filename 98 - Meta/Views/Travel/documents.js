// documents.js — every document for the trip: trip-wide Documents plus each itinerary note's Booking,
// grouped, and anything in the trip's documents folder that nothing links to yet (Unfiled).
// shared code, loaded once and kept in memory until the file changes
const lib = async (n) => { const p = `98 - Meta/Views/Travel/lib/${n}.js`, f = app.vault.getAbstractFileByPath(p), libs = ((window.travelVault ??= {}).libs ??= {}); if (libs[n]?.mtime === f.stat.mtime) return libs[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); libs[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
const D = (await lib("dom"))(app, dv.current().file.path);   // draws text directly (no markdown renderer)
const trip = dv.current();
const t = (await lib("tripData"))(dv, trip);
const L = await lib("itinLine").then((f) => f({ dv, app }));
const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
const folder = `${cfg["Trip Documents Folder"] ?? "06 - Resources/Documents/Trips"}/${trip.file.name}`;
const fileOf = (l) => { const s = typeof l === "string" ? l : l?.path; if (!s) return null; const name = s.replace(/^\[\[|\]\]$/g, "").split("|")[0]; return app.metadataCache.getFirstLinkpathDest(name, trip.file.path); };
const icon = (f) => ({ pdf: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", heic: "🖼️", eml: "✉️", md: "📝" })[f.extension] ?? "📎";
const groups = { "Transport": [], "Stays": [], "Insurance & Entry": [], "Other": [] };
const used = new Set();
for (const l of [].concat(trip.Documents ?? [])) {
    const f = fileOf(l); if (!f) continue; used.add(f.path);
    groups[/insur|visa|eta\b|esta|evisa|passport|vaccin/i.test(f.basename) ? "Insurance & Entry" : "Other"].push({ f, note: "" });
}
for (const p of t.itins) {
    const f = fileOf(p.Booking); if (!f) continue; used.add(f.path);
    const g = p.Subtype === "Transport" ? "Transport" : p.Subtype === "Stay" ? "Stays" : "Other";
    groups[g].push({ f, note: ` <small>${L.iconFor(p)} ${L.label(p)}${p.Confirmation ? " · " + p.Confirmation : ""}</small>` });
}
const filesIn = (path) => { const out = [], walk = (f) => f?.children?.forEach((c) => (c.children ? walk(c) : out.push(c))); walk(app.vault.getAbstractFileByPath(path)); return out; };
const loose = filesIn(folder).filter((f) => !used.has(f.path));
if (loose.length) groups["Unfiled"] = loose.map((f) => ({ f, note: "" }));
const box = dv.el("div", "", { cls: "travel-docs" });
const any = Object.values(groups).some((g) => g.length);
if (!any) { box.createDiv({ cls: "travel-muted", text: `No documents yet. Put files in ${folder} and link them from a Booking or the trip's Documents` }); return; }
for (const [name, items] of Object.entries(groups)) {
    if (!items.length) continue;
    const col = box.createDiv({ cls: "travel-docs-group" });
    col.createEl("strong", { text: name });
    for (const { f, note } of items) D.span(col.createDiv(), `${icon(f)} [[${f.path}|${f.basename}]]${note}`);
}
