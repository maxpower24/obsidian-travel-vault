/**
 * travelOrchestrator.js
 * Trip creation and refresh. Delegates config, file system, notices, strings and HTTP to the sys utilities.
 * The trip note's widgets are shared Dataview views (98 - Meta/Views/Travel); this file only writes the
 * frontmatter and the layout that embeds them.
 */

module.exports = (tp) => {

    const config = tp.user.sysConfig(tp);
    const fs     = tp.user.sysFs(tp);
    const notice = tp.user.sysNotice(tp);
    const str    = tp.user.sysString(tp);
    const http   = tp.user.sysHttp(tp);
    const geo    = tp.user.sysGeo(tp);

    const NAV   = "98 - Meta/Views/nav";
    const VIEWS = "98 - Meta/Views/Travel";
    const fmOf  = (f) => tp.app.metadataCache.getFileCache(f)?.frontmatter ?? {};
    const q     = (v) => JSON.stringify(v ?? "");

    /** Frontmatter + layout for a trip note. Values the user entered are kept. */
    function tripContent(name, cfg, old = {}) {
        const keep = (k, d = "") => (old[k] !== undefined && old[k] !== null ? old[k] : d);
        const BASES = cfg["Bases Folder"];
        // widgets render through the Vault Views plugin: ```view <script under 98 - Meta/Views> <input>```
        const view = (v, input) => `\`\`\`view\nTravel/${v}${input ? " " + input : ""}\n\`\`\``;
        const inCol = (block, depth = 3) => block.split("\n").map((l) => `${"> ".repeat(depth)}${l}`).join("\n");
        // one Dataview block per column: panel.js renders the widgets (boxed unless plain)
        const panel = (names, plain = false) => view("panel", `{ widgets: ${JSON.stringify(names)}${plain ? ", plain: true" : ""} }`);
        const button = (label, file, style = "default") => [
            "```meta-bind-button", `label: ${label}`, `style: ${style}`, "action:", "  type: runTemplaterFile",
            `  templateFile: "98 - Meta/Templates/Travel/${file}"`, "```"].join("\n");
        const date = (v) => (v ? String(v).slice(0, 10) : "");
        const tripsFolder = cfg["Trips Folder"];
        return `---
Type: Trip
Start: ${date(keep("Start")) || ""}
End: ${date(keep("End")) || ""}
Booked: ${keep("Booked", false)}
Cancelled: ${keep("Cancelled", false)}
Banner: ${q(keep("Banner"))}
Documents: ${JSON.stringify([].concat(keep("Documents", [])))}
My Notes: ${q(keep("My Notes"))}
cssclasses:
  - full-width
  - trip-note
  - hide-properties
  - card-redirect
---
\`\`\`nav
\`\`\`
${view("tripStatus")}

> [!columns|1-2.5-1 centre-first stretch]
> > [!col]
${inCol(panel(["countdown", "tripEssentials", "tripHere", "tripMoney"]), 2)}
> >
> > > [!col|box]
${inCol(button("Add to Trip", "Add to Trip.md", "primary"))}
${inCol(button("Refresh Trip", "Trip Refresh.md"))}
>
> > [!col|fill]
${inCol(panel(["route", "todayNext"], true), 2)}
> >
> > **Notes**
> > \`\`\`meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > \`\`\`
>
> > [!col]
${inCol(panel(["gaps", "entryHealth", "packing", "todos", "tripHolidays"]), 2)}

---

> [!columns|1-1]
> > [!col]
> > #### Countries
> > ![[${BASES}/Trip Places.base#Countries]]
>
> > [!col]
> > #### Cities & Regions
> > ![[${BASES}/Trip Places.base#Cities & Regions]]

## Itinerary
![[${BASES}/Trip Itinerary.base#Itinerary by Day]]

> [!columns|1-1]
> > [!col]
> > #### Stays
> > ![[${BASES}/Trip Itinerary.base#Stays]]
>
> > [!col]
> > #### Transport
> > ![[${BASES}/Trip Itinerary.base#Transport]]

> [!columns|1-1]
> > [!col]
> > #### Ideas
> > ![[${BASES}/Trip Itinerary.base#Ideas]]
>
> > [!col]
> > #### Places to Consider
> > ![[${BASES}/Trip Places.base#Places to Consider]]

## Documents
${view("documents")}

---

\`\`\`mapview
${JSON.stringify({ name: "Default", mapZoom: 5, centerLat: 0, centerLng: 0, query: `linkedto:"${name}" AND path:"${tripsFolder}/${name}"`, chosenMapSource: Number(cfg["Map Source Index"] ?? 0), autoFit: true, lock: false, showLinks: false, linkColor: "red", markerLabels: "off", embeddedHeight: 450 })}
\`\`\`
`;
    }

    /** Ask for a date (YYYY-MM-DD). Blank is allowed; anything else invalid re-prompts. */
    async function askDate(label, def = "") {
        while (true) {
            const v = await tp.system.prompt(`${label} (YYYY-MM-DD, blank = not set yet)`, def);
            if (v === null || v.trim() === "") return "";
            if (/^\d{4}-\d{2}-\d{2}$/.test(v.trim()) && !isNaN(Date.parse(v.trim()))) return v.trim();
            notice.show("Use the format YYYY-MM-DD, e.g. 2026-12-18");
        }
    }

    /**
     * Create a new trip. Run from "Trip Template" (Meta Bind templaterCreateNote in the Trips folder).
     * Prompts for name and dates, moves the new note to <Trips>/<Name>/<Name>.md, creates the packing note
     * and the documents folder, and RETURNS the note content: Templater writes the template's output into
     * the new note after the script runs, so the content must come back through tR, not vault.modify.
     *
     * @param {string} configPath - Vault-relative path to the travel config note
     * @returns {Promise<string>} the trip note content ("" if cancelled)
     */
    async function createNewTrip(configPath) {
        const cfg = config.loadConfig(configPath);
        const tripsFolder = cfg["Trips Folder"];
        if (!tripsFolder) throw new Error(`travelOrchestrator: "Trips Folder" is not set in ${configPath}.`);

        let tripName;
        while (true) {
            const input = await tp.system.prompt("Trip name", "", true);
            if (input === null) return "";
            const clean = str.sanitiseFileName(input);
            if (!clean) { notice.show("Trip name cannot be empty or contain only invalid characters."); continue; }
            if (fs.folderExists(`${tripsFolder}/${clean}`)) { notice.show(`A trip named "${clean}" already exists.`); continue; }
            tripName = clean;
            break;
        }
        const start = await askDate("Start date");
        const end   = start ? await askDate("End date (the day you fly home)") : "";

        const folder = `${tripsFolder}/${tripName}`;
        await fs.createFolder(folder);
        await fs.moveNote(tp.app.vault.getAbstractFileByPath(tp.file.path(true)), `${folder}/${tripName}.md`);

        const packing = `${folder}/Packing - ${tripName}.md`;
        if (!fs.noteExists(packing)) {
            await fs.createNote(packing, `---\nType: Packing List\nTrip: "[[${tripName}]]"\n---\n\`\`\`nav\n\`\`\`\nTrip-specific extras. "Refresh Packing" on the trip adds your baseline and country items.\n`);
        }
        const docs = cfg["Trip Documents Folder"];
        if (docs && !(await tp.app.vault.adapter.exists(`${docs}/${tripName}`))) await tp.app.vault.adapter.mkdir(`${docs}/${tripName}`);

        notice.show(`Trip "${tripName}" created.`);
        return tripContent(tripName, cfg, { Start: start, End: end });
    }

    /** One-time cover picker (same pop-up as countries and cities). Resolves to the chosen index, 0 if dismissed. */
    function pickImage(paths, title) {
        return new Promise((resolve) => {
            let chosen = 0;
            const modal = new tp.obsidian.Modal(tp.app);
            modal.titleEl.setText(title);
            modal.modalEl.style.width = "min(960px, 92vw)";
            const grid = modal.contentEl.createDiv();
            grid.style.cssText = "display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;";
            paths.forEach((p, i) => {
                const cell = grid.createDiv();
                const img = cell.createEl("img", { attr: { src: tp.app.vault.adapter.getResourcePath(p) } });
                img.style.cssText = "width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;cursor:pointer;";
                cell.createDiv({ text: `Photo ${i + 1}` }).style.cssText = "text-align:center;margin-top:4px;";
                img.onclick = () => { chosen = i; modal.close(); };
            });
            modal.onClose = () => resolve(chosen);
            modal.open();
        });
    }

    /**
     * Trip cover: photos of the first country you stay in, leaving out the photo already used as that
     * country's cover (compared by file contents), 3 to pick from, chosen once.
     * @returns {Promise<string>} vault path of the cover, or "" if there's nothing to pick from yet
     */
    async function pickTripCover(cfg, file) {
        const adapter = tp.app.vault.adapter;
        const name = file.basename;
        const dir = `${cfg["Trip Images Folder"]}/${name}`;
        const final = `${dir}/${name}.jpg`;
        if (await adapter.exists(final)) return final;

        // first Stay (by Start) of this trip that has a Country
        const stays = tp.app.vault.getMarkdownFiles().map((f) => ({ f, fm: fmOf(f) }))
            .filter(({ fm }) => fm.Type === "Itinerary" && fm.Subtype === "Stay" && fm.Start && fm.Country
                && String(fm.Trip ?? "").includes(`[[${name}`))
            .sort((a, b) => String(a.fm.Start).localeCompare(String(b.fm.Start)));
        if (!stays.length) return "";
        const countryFile = tp.app.metadataCache.getFirstLinkpathDest(String(stays[0].fm.Country).replace(/^\[\[|\]\]$/g, "").split("|")[0], file.path);
        if (!countryFile) return "";

        // fingerprint of the country's own cover, to leave it out
        const hash = async (buf) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf))).map((b) => b.toString(16).padStart(2, "0")).join("");
        const countryCover = String(fmOf(countryFile).Banner ?? "").replace(/^\[\[|\]\]$/g, "");
        const skip = countryCover && (await adapter.exists(countryCover)) ? await hash(await adapter.readBinary(countryCover)) : null;

        const key = geo.getGoogleApiKey(cfg["Google Secret"]);
        const search = await http.requestJson({
            url: "https://places.googleapis.com/v1/places:searchText",
            method: "POST",
            headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.photos" },
            body: { textQuery: countryFile.basename, pageSize: 1 },
        });
        const photos = search.json?.places?.[0]?.photos ?? [];
        if (!(await adapter.exists(dir))) await adapter.mkdir(dir);
        const want = Number(cfg["Cover Candidates"] ?? 3);
        const cands = [];
        for (const photo of photos) {
            if (cands.length >= want) break;
            const media = await http.requestJson({ url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${encodeURIComponent(key)}` });
            if (!media.json?.photoUri) continue;
            const res = await tp.obsidian.requestUrl({ url: media.json.photoUri, throw: false });
            if (res.status < 200 || res.status >= 300) continue;
            if (skip && (await hash(res.arrayBuffer)) === skip) continue;   // the country's cover
            const p = `${dir}/${name}-${cands.length + 1}.jpg`;
            await adapter.writeBinary(p, res.arrayBuffer);
            cands.push(p);
        }
        if (!cands.length) return "";
        const idx = cands.length === 1 ? 0 : await pickImage(cands, `Choose a cover for ${name}`);
        await adapter.rename(cands[idx], final);
        for (const p of cands) if (p !== cands[idx] && (await adapter.exists(p))) await adapter.remove(p);
        return final;
    }

    /**
     * Refresh the open trip note: rewrite its layout (keeping everything you entered) and, if it has no
     * cover yet and has a first stay, offer the cover picker. Run from "Trip Refresh" (runTemplaterFile).
     */
    async function refreshTrip(configPath) {
        const cfg = config.loadConfig(configPath);
        const file = tp.app.workspace.getActiveFile();
        if (!file || fmOf(file).Type !== "Trip") { notice.show("Open a trip note first."); return; }
        const old = { ...fmOf(file) };
        if (!old.Banner) {
            try { const cover = await pickTripCover(cfg, file); if (cover) old.Banner = `[[${cover}]]`; }
            catch (e) { console.error("Trip cover failed", e); notice.show(`Trip cover failed: ${e.message}`, 8000); }
        }
        await tp.app.vault.modify(file, tripContent(file.basename, cfg, old));
        notice.show(`Trip "${file.basename}" refreshed.${old.Banner ? "" : " Add a stay to pick a cover."}`);
    }

    return {
        createNewTrip,
        refreshTrip,
        tripContent,
    };

};
