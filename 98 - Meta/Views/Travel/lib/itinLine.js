/**
 * itinLine.js — one shared way to show an itinerary item: icon · when · what ✏️
 * module.exports = async ({ dv, app }) => ({ iconFor, target, label, link, line, edit })
 * "what" links the place (or city, or a transport leg's destination), never the itinerary note itself.
 * ✏️ opens the edit pop-up (lib/itineraryEditor.js).
 */
module.exports = async ({ dv, app }) => {
    const BASE = "98 - Meta/Views/Travel";
    const store = ((window.travelVault ??= {}).libs ??= {});
    // same cache as the views' loader: read once, reloaded only when the file changes
    const load = async (n) => { const f = app.vault.getAbstractFileByPath(`${BASE}/lib/${n}.js`); if (store[n]?.mtime === f.stat.mtime) return store[n].exports; const m = { exports: {} }; new Function("module", "exports", await app.vault.cachedRead(f))(m, m.exports); store[n] = { mtime: f.stat.mtime, exports: m.exports }; return m.exports; };
    const ui = await load("ui");
    const editor = await load("itineraryEditor");
    const D = (await load("dom"))(app, dv.current().file.path);   // direct drawing, no markdown renderer
    const iconFile = app.vault.getAbstractFileByPath(`${BASE}/placeIcons.json`);
    if (store.icons?.mtime !== iconFile?.stat.mtime) {
        try { store.icons = { mtime: iconFile.stat.mtime, data: JSON.parse(await app.vault.cachedRead(iconFile)) }; }
        catch (e) { console.error("placeIcons.json unreadable", e); store.icons = { mtime: null, data: { types: {}, groups: {}, subtypes: {}, modes: {}, default: "📍" } }; }
    }
    const ICONS = store.icons.data;

    const pg = (l) => (l ? dv.page(l) : null);
    const short = (n) => String(n ?? "?").replace(/,[^,]*$/, "");
    const nameOf = (l) => pg(l)?.file.name ?? (typeof l === "string" ? l : l?.path?.split("/").pop()?.replace(/\.md$/, "")) ?? "?";
    const iconFor = (p) => {
        if (p.Subtype === "Transport") return ICONS.modes?.[p.Mode] ?? ICONS.subtypes?.Transport ?? "🚆";
        const pl = pg(p.Place);
        return (pl && (ICONS.types?.[pl["Primary Type"]] ?? ICONS.groups?.[pl.Group])) ?? ICONS.subtypes?.[p.Subtype] ?? ICONS.default;
    };
    const target = (p) => (p.Subtype === "Transport" ? pg(p.To) : null) ?? pg(p.Place) ?? pg(p.Locale) ?? pg(p.Country);
    const label = (p) => p.Subtype === "Transport"
        ? `${short(nameOf(p.From))} → ${short(nameOf(p.To))}${p.Service ? ` · ${p.Service}` : ""}`
        : short(target(p)?.file.name ?? p.file.name);
    const link = (p) => {
        const t = target(p);
        if (p.Subtype === "Transport") return t ? `[[${t.file.path}|${label(p)}]]` : label(p);
        return t ? `[[${t.file.path}|${label(p)}]]` : label(p);
    };
    const edit = (p, onSaved) => editor({ app, dv, ui, path: p.file.path, onSaved });
    /** Render one line into container. when = text shown before the name (e.g. "Sun 20 Dec · 08:00"). */
    const line = (container, p, when, extra = "") => {
        const row = container.createDiv({ cls: "travel-itin" });
        D.span(row.createSpan({ cls: "travel-itin-text" }), `${iconFor(p)} ${when ? when + " · " : ""}${link(p)}${extra}`);
        const b = row.createEl("span", { cls: "travel-edit", text: "✏️", attr: { title: "Edit", role: "button" } });
        b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); edit(p); };
        return row;
    };
    return { iconFor, target, label, link, line, edit, ICONS };
};
