/**
 * itineraryEditor.js — edit an itinerary note in a pop-up, without opening it.
 * module.exports = ({ app, dv, ui, path, onSaved }) => void
 * Saving writes the frontmatter, copies Locale / Country / location from the chosen place (or city),
 * and renames the note to match: "2026-12-20 - Senso-ji", "2026-12-23 - Tokyo to Kyoto", "Idea - Senso-ji".
 */
module.exports = ({ app, dv, ui, path, onSaved }) => {
    const file = app.vault.getAbstractFileByPath(path);
    if (!file) { new Notice("Itinerary note not found"); return; }
    const fm = app.metadataCache.getFileCache(file)?.frontmatter ?? {};
    const SUBTYPES = ["Stay", "Activity", "Meal", "Transport"];
    const MODES = ["Flight", "Train", "Bus", "Ferry", "Cruise", "Car"];
    const cfg = dv.page("98 - Meta/System/Travel/_config.md") ?? {};
    const docsRoot = cfg["Trip Documents Folder"] ?? "06 - Resources/Documents/Trips";
    const trip = fm.Trip ? dv.page(fm.Trip) : null;

    const linkName = (v) => (typeof v === "string" ? (v.match(/^\[\[([^\]|]+)/)?.[1] ?? v) : v?.path ?? "").replace(/\.md$/, "").split("/").pop();
    const toLink = (name) => (name ? `[[${name}]]` : "");
    const short = (n) => n.replace(/,[^,]*$/, "");
    const dateOf = (v) => (v ? String(v).slice(0, 10) : "");
    const timeOf = (v) => (v && String(v).length > 10 ? String(v).slice(11, 16) : "");
    const names = (type) => dv.pages().where((p) => p.Type === type).map((p) => p.file.name).array().sort();
    const filesIn = (path) => { const out = [], walk = (f) => f?.children?.forEach((c) => (c.children ? walk(c) : out.push(c))); walk(app.vault.getAbstractFileByPath(path)); return out; };
    const docFiles = trip ? filesIn(`${docsRoot}/${trip.file.name}`).map((f) => f.path) : [];

    ui.openModal(`Edit ${file.basename}`, (el, close) => {
        el.addClass("travel-editor");
        const lists = el.createDiv();
        const datalist = (id, items) => { const d = lists.createEl("datalist", { attr: { id } }); items.forEach((v) => d.createEl("option", { attr: { value: v } })); };
        const uid = Math.random().toString(36).slice(2, 8);
        datalist(`tv-places-${uid}`, names("Place"));
        datalist(`tv-locales-${uid}`, names("Locale"));
        datalist(`tv-stops-${uid}`, [...names("Locale"), ...names("Place")]);
        datalist(`tv-docs-${uid}`, docFiles);

        const row = (label, parent = el) => { const r = parent.createDiv({ cls: "travel-editor-row" }); r.createEl("label", { text: label }); return r.createDiv({ cls: "travel-editor-input" }); };
        const input = (parent, attrs) => parent.createEl("input", { attr: attrs });
        const select = (parent, options, value) => { const s = parent.createEl("select", { cls: "dropdown" }); options.forEach((o) => s.createEl("option", { text: o, attr: { value: o } })); s.value = value; return s; };

        const subtype = select(row("Type"), SUBTYPES, fm.Subtype ?? "Activity");
        const sRow = row("Start");
        const sDate = input(sRow, { type: "date", value: dateOf(fm.Start) });
        const sTime = input(sRow, { type: "time", value: timeOf(fm.Start) });
        const eRow = row("End");
        const eDate = input(eRow, { type: "date", value: dateOf(fm.End) });
        const eTime = input(eRow, { type: "time", value: timeOf(fm.End) });
        const place  = input(row("Place"),  { type: "text", list: `tv-places-${uid}`,  value: linkName(fm.Place),  placeholder: "Optional" });
        const locale = input(row("City / Region"), { type: "text", list: `tv-locales-${uid}`, value: linkName(fm.Locale), placeholder: "Filled from the place if blank" });

        const tBox = el.createDiv({ cls: "travel-editor-transport" });
        const mode = select(row("Mode", tBox), MODES, fm.Mode ?? "Train");
        const from = input(row("From", tBox), { type: "text", list: `tv-stops-${uid}`, value: linkName(fm.From) });
        const to   = input(row("To", tBox),   { type: "text", list: `tv-stops-${uid}`, value: linkName(fm.To) });
        const service = input(row("Service", tBox), { type: "text", value: fm.Service ?? "", placeholder: "e.g. JL 772, Nozomi 23" });
        const showT = () => tBox.toggleClass("travel-hidden", subtype.value !== "Transport");
        subtype.onchange = showT; showT();

        const booking = input(row("Booking"), { type: "text", list: `tv-docs-${uid}`, value: String(fm.Booking ?? "").match(/^\[\[([^\]|]+)/)?.[1] ?? "", placeholder: `File in ${docsRoot}/${trip?.file.name ?? "<Trip>"}` });
        const conf = input(row("Confirmation"), { type: "text", value: fm.Confirmation ?? "" });

        const buttons = el.createDiv({ cls: "modal-button-container" });
        const open = buttons.createEl("button", { text: "Open note" });
        const cancel = buttons.createEl("button", { text: "Cancel" });
        const save = buttons.createEl("button", { text: "Save", cls: "mod-cta" });
        cancel.onclick = close;
        open.onclick = () => { close(); app.workspace.getLeaf(false).openFile(file); };

        save.onclick = async () => {
            const stamp = (d, t) => (d ? (t ? `${d}T${t}` : d) : null);
            const placeFile = place.value.trim() ? dv.page(place.value.trim()) : null;
            const localeName = locale.value.trim() || (placeFile?.Locale ? linkName(placeFile.Locale) : "");
            const localeFile = localeName ? dv.page(localeName) : null;
            const country = placeFile?.Country ?? localeFile?.Country ?? fm.Country ?? null;
            await app.fileManager.processFrontMatter(file, (f) => {
                f.Subtype = subtype.value;
                f.Start = stamp(sDate.value, sTime.value);
                f.End = stamp(eDate.value, eTime.value);
                f.Place = toLink(place.value.trim()) || null;
                f.Locale = toLink(localeName) || null;
                f.Country = country ? toLink(linkName(country)) : null;
                f.location = placeFile?.location ?? localeFile?.Coordinates ?? null;
                if (subtype.value === "Transport") {
                    f.Mode = mode.value; f.From = toLink(from.value.trim()) || null; f.To = toLink(to.value.trim()) || null;
                    f.Service = service.value.trim() || null;
                } else { delete f.Mode; delete f.From; delete f.To; delete f.Service; }
                f.Booking = booking.value.trim() ? `[[${booking.value.trim()}]]` : null;
                f.Confirmation = conf.value.trim() || null;
            });
            // rename to match the new details
            const what = subtype.value === "Transport" && (from.value || to.value)
                ? `${short(from.value.trim() || "?")} to ${short(to.value.trim() || "?")}`
                : place.value.trim() || short(localeName) || file.basename.replace(/^(Idea|\d{4}-\d{2}-\d{2}) - /, "");
            const base = `${sDate.value || "Idea"} - ${what}`.replace(/[*"\\/<>:|?]/g, "").trim();
            if (base !== file.basename) {
                let target = `${file.parent.path}/${base}.md`, n = 2;
                while (app.vault.getAbstractFileByPath(target)) target = `${file.parent.path}/${base} (${n++}).md`;
                await app.fileManager.renameFile(file, target);
            }
            new Notice(`Saved ${base}`);
            close();
            onSaved?.();
        };
    });
};
