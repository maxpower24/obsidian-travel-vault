<%*
/**
 * City Template — build or rebuild a Cities & Regions (Locale) note from live APIs
 * (Google Places, Wikipedia, Wikidata, Open-Meteo climate history).
 * - Type "City, Country". If a Locale note with that exact name exists (e.g. the stub "Tokyo, Japan"),
 *   that note is filled in place; otherwise a new note is created. (Run with a Locale note open and its name is pre-filled.)
 * - Re-running keeps what you've entered (Wishlist, Local Tips, Notes, Locale Type…).
 * - Cover chosen ONCE, like countries: the pick becomes "<Note name>.jpg" (Banner).
 * - Writes <Locales Folder>/<City>, <Country>.md. The country note is found by its Country Code;
 *   if it doesn't exist yet you'll get a notice to run Country Template.
 * Widgets are shared views in 98 - Meta/Views/Travel; best-time-to-visit is calculated once here.
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
const cfg  = tp.user.sysConfig(tp).loadConfig(CONFIG_PATH);
const need = (k) => { if (cfg[k] === undefined || cfg[k] === null || cfg[k] === "") throw new Error(`"${k}" is not set in ${CONFIG_PATH}`); return cfg[k]; };

const LOCALES     = need("Locales Folder");
const COUNTRIES   = need("Countries Folder");
const BASES       = need("Bases Folder");
const IMG_DIR     = need("Locale Images Folder");
const GOOGLE_ID   = need("Google Secret");
const MAP_SOURCE  = Number(cfg["Map Source Index"] ?? 0);
const CANDIDATES  = Number(cfg["Cover Candidates"] ?? 3);
const BANNER_KEY  = "Banner";   // must match the Pretty Properties banner property
const ICON_KEY    = "Icon";     // must match the Pretty Properties icon property
const NAV_VIEW    = "98 - Meta/Views/nav";
const VIEWS       = "98 - Meta/Views/Travel";
const TYPE_ICONS  = { City: "🏙️", Region: "🏞️", Island: "🏝️" };

const http    = tp.user.sysHttp(tp);
const geo     = tp.user.sysGeo(tp);
const str     = tp.user.sysString(tp);
const adapter = tp.app.vault.adapter;
const UA      = { "User-Agent": "ObsidianTravelVault/0.1 (personal vault)" };
const fmOf    = (f) => tp.app.metadataCache.getFileCache(f)?.frontmatter ?? {};

// ---- which locale? (open Locale note first, else ask)
const active = tp.app.workspace.getActiveFile();
const openStub = active && fmOf(active).Type === "Locale" ? active : null;
const input  = await tp.system.prompt("City or region (e.g. Kyoto, Japan)", openStub ? openStub.basename : "");
if (!input) return;
// an existing Locale note with exactly this name is filled in place, whatever Google calls the place
const stub = tp.app.vault.getMarkdownFiles()
    .find((f) => fmOf(f).Type === "Locale" && f.basename.toLowerCase() === input.trim().toLowerCase()) ?? null;

async function ensureDir(p) { if (!(await adapter.exists(p))) await adapter.mkdir(p); }   // creates parent folders too
async function download(url, path, headers = {}) {
    const res = await tp.obsidian.requestUrl({ url, headers, throw: false });
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status} downloading ${path}`);
    await adapter.writeBinary(path, res.arrayBuffer);
    return path;
}
const q = (v) => JSON.stringify(v ?? "");
const opts = (list) => list.map((x) => `option(${x})`).join(", ");

/** One-time image picker: thumbnails in a modal. Resolves to the chosen index (0 if dismissed). */
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
            const img = cell.createEl("img", { attr: { src: adapter.getResourcePath(p) } });
            img.style.cssText = "width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;cursor:pointer;";
            cell.createDiv({ text: `Photo ${i + 1}` }).style.cssText = "text-align:center;margin-top:4px;";
            img.onclick = () => { chosen = i; modal.close(); };
        });
        modal.onClose = () => resolve(chosen);
        modal.open();
    });
}

try {
    const key = geo.getGoogleApiKey(GOOGLE_ID);

    // ---- Google: the place itself
    const search = await http.requestJson({
        url: "https://places.googleapis.com/v1/places:searchText",
        method: "POST",
        headers: {
            "X-Goog-Api-Key": key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.types,places.location,places.timeZone,places.addressComponents,places.photos",
        },
        body: { textQuery: input.trim(), pageSize: 1 },
    });
    const g = search.json?.places?.[0];
    if (!g) throw new Error(`Google found nothing for "${input}" (HTTP ${search.status})`);

    const comp  = (type) => (g.addressComponents ?? []).find((c) => c.types?.includes(type));
    const cc    = comp("country")?.shortText ?? "";
    const state = comp("administrative_area_level_1")?.longText ?? "";
    const city  = g.displayName?.text ?? input.split(",")[0].trim();
    const types = g.types ?? [];
    const lat   = g.location?.latitude, lng = g.location?.longitude;
    const tz    = g.timeZone?.id ?? "";
    const norm = (x) => (x ?? "").toLowerCase().replace(/\b(city|prefecture|metropolis|state)\b/g, "").replace(/[^a-z]/g, "");
    const sameAsParent = [state, comp("country")?.longText].some((n) => n && norm(n) === norm(city));
    const guessedType = sameAsParent || ["locality", "colloquial_area", "postal_town", "administrative_area_level_3", "sublocality"].some((t) => types.includes(t)) ? "City"
                      : (types.includes("natural_feature") && /\b(island|isle|islands)\b/i.test(city)) || types.includes("archipelago") ? "Island"
                      : "Region";

    // ---- Country note, matched by Country Code
    const countryFile = tp.app.vault.getMarkdownFiles()
        .find((f) => f.path.startsWith(COUNTRIES + "/") && fmOf(f).Type === "Country" && fmOf(f)["Country Code"] === cc);
    const countryName = countryFile ? countryFile.basename : (comp("country")?.longText ?? "");
    if (!countryFile) new Notice(`No country note for ${cc || "this country"} yet. Run Country Template for it.`, 8000);

    // ---- note path (an open stub keeps its name, so links to it stay valid)
    const noteName = stub ? stub.basename : str.sanitiseFileName(`${city}, ${countryName}`);
    await ensureDir(LOCALES);
    const notePath = stub ? stub.path : `${LOCALES}/${noteName}.md`;
    const existing = stub ?? tp.app.vault.getAbstractFileByPath(notePath);
    const old  = existing ? fmOf(existing) : {};
    const keep = (k, d = "") => (old[k] !== undefined && old[k] !== null ? old[k] : d);
    const placeName = noteName.replace(/,[^,]*$/, "");

    // ---- Cover: choose once
    const coverDir   = `${IMG_DIR}/${noteName}`;
    const finalCover = `${coverDir}/${noteName}.jpg`;
    await ensureDir(coverDir);
    let cover = "";
    if (await adapter.exists(finalCover)) {
        cover = finalCover;
    } else {
        const cands = [];
        for (let i = 1; i <= CANDIDATES; i++) {
            const p = `${coverDir}/${noteName}-${i}.jpg`;
            if (await adapter.exists(p)) cands.push(p);
        }
        if (cands.length === 0) {
            for (const [i, photo] of (g.photos ?? []).slice(0, CANDIDATES).entries()) {
                const media = await http.requestJson({
                    url: `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${encodeURIComponent(key)}`,
                });
                if (media.json?.photoUri) cands.push(await download(media.json.photoUri, `${coverDir}/${noteName}-${i + 1}.jpg`));
            }
        }
        if (cands.length > 0) {
            const idx = cands.length === 1 ? 0 : await pickImage(cands, `Choose a cover for ${placeName}`);
            await adapter.rename(cands[idx], finalCover);
            for (const p of cands) if (p !== cands[idx] && (await adapter.exists(p))) await adapter.remove(p);
            cover = finalCover;
        }
    }

    // ---- Wikipedia: best search match for "City Country", then its summary
    let extract = "", wikiUrl = "", wikidataId = "";
    const ws = await http.requestJson({
        url: "https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=" + encodeURIComponent(`${city} ${countryName}`),
        headers: UA,
    });
    const title = ws.json?.query?.search?.[0]?.title;
    if (title) {
        const wiki = await http.requestJson({ url: "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title), headers: UA });
        extract    = (wiki.json?.extract ?? "").replace(/\n/g, " ");
        wikiUrl    = wiki.json?.content_urls?.desktop?.page ?? "";
        wikidataId = wiki.json?.wikibase_item ?? "";
    }

    // ---- Wikidata: population (most recent dated figure)
    let population = "";
    if (wikidataId) {
        const wd = await http.requestJson({
            url: `https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P1082&entity=${wikidataId}`,
            headers: UA,
        });
        const claims = wd.json?.claims?.P1082 ?? [];
        const when = (c) => c.qualifiers?.P585?.[0]?.datavalue?.value?.time ?? "";
        const best = [...claims].filter((c) => c.rank !== "deprecated").sort((a, b) => when(b).localeCompare(when(a)))[0];
        const n = Number(best?.mainsnak?.datavalue?.value?.amount);
        if (Number.isFinite(n)) {
            const yr = when(best).slice(1, 5);
            population = `${n.toLocaleString("en-AU")}${yr ? ` (${yr})` : ""}`;
        }
    }

    // ---- Best time to visit: monthly averages from 10 years of Open-Meteo history (calculated once)
    let climate = null;   // { months: [[high, low, rain], ×12], best: [bool ×12] } for the climate view
    if (lat !== undefined && lng !== undefined) {
        const y = new Date().getFullYear() - 1;
        const arc = await http.requestJson({
            url: `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${y - 9}-01-01&end_date=${y}-12-31`
               + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto",
        });
        const d = arc.json?.daily;
        if (d?.time?.length) {
            const M = Array.from({ length: 12 }, () => ({ hi: [], lo: [], rain: 0 }));
            d.time.forEach((t, i) => {
                const m = M[Number(t.slice(5, 7)) - 1];
                if (d.temperature_2m_max[i] !== null) m.hi.push(d.temperature_2m_max[i]);
                if (d.temperature_2m_min[i] !== null) m.lo.push(d.temperature_2m_min[i]);
                m.rain += d.precipitation_sum[i] ?? 0;
            });
            const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
            const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const rows = M.map((m, i) => ({ name: names[i], hi: avg(m.hi), lo: avg(m.lo), rain: m.rain / 10 }));
            // "best" = comfortable highs (18–28 °C) and no wetter than the typical month
            const medianRain = [...rows].map((r) => r.rain).sort((a, b) => a - b)[6];
            const good = rows.map((r) => r.hi >= 18 && r.hi <= 28 && r.rain <= medianRain);
            climate = { months: rows.map((r) => [Math.round(r.hi), Math.round(r.lo), Math.round(r.rain)]), best: good };
        }
    }

    const localeType = keep("Locale Type", guessedType);
    const coords = lat !== undefined && lng !== undefined ? `${lat},${lng}` : keep("Coordinates");
    const text = (k) => `\`INPUT[text:["${k}"]]\``;

    const content = `---
Type: Locale
Country: ${q(countryName ? `[[${countryName}]]` : "")}
Region: ${q(state)}
Locale Type: ${q(localeType)}
${BANNER_KEY}: ${q(cover ? `[[${cover}]]` : "")}
${ICON_KEY}: ${q(TYPE_ICONS[localeType] ?? "")}
Coordinates: ${q(coords)}
Timezone: ${q(tz || keep("Timezone"))}
Wishlist: ${keep("Wishlist", false)}
Transit Card: ${q(keep("Transit Card"))}
Airport Transfer: ${q(keep("Airport Transfer"))}
Ride Share: ${q(keep("Ride Share"))}
Micromobility: ${q(keep("Micromobility"))}
Safety: ${q(keep("Safety", keep("Areas to Avoid")))}
My Notes: ${q(keep("My Notes"))}
Last Refreshed: ${tp.date.now("YYYY-MM-DD")}
cssclasses:
  - full-width
  - location-note
  - hide-properties
---
\`\`\`nav
\`\`\`
\`\`\`view
Travel/status { field: "Locale" }
\`\`\`

> [!columns|1-2.5-1 centre-first stretch]
> > [!col]
> > > [!col|box]
> > > **Country** ${countryName ? `[[${countryName}]]` : "—"}
> > > **State / Region** ${state || "—"}
> > > **Type** \`INPUT[inlineSelect(${opts(Object.keys(TYPE_ICONS))}):["Locale Type"]]\`
> > > **Population** ${population || "—"}
> > >
> > > \`\`\`meta-bind-button
> > > label: Add to Trip
> > > style: primary
> > > action:
> > >   type: command
> > >   command: travel:add-to-trip
> > > \`\`\`
> >
> > \`\`\`view
> > Travel/panel { widgets: [
> >     { name: "fromCountry" },
> >     { name: "localTime", input: ${JSON.stringify({ tz, place: placeName })} },
> >     { name: "weather", input: ${JSON.stringify({ lat, lng })} }
> > ] }
> > \`\`\`
>
> > [!col|fill]
> > ${extract}
> > ${wikiUrl ? `[Wikipedia](${wikiUrl})` : ""}
> >
> > \`\`\`view
> > Travel/climate ${JSON.stringify(climate)}
> > \`\`\`
> >
> > **Notes**
> > \`\`\`meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > \`\`\`
>
> > [!col]
> > > [!todo] Local Tips
> > > **Transit card** ${text("Transit Card")}
> > > **Airport transfer** ${text("Airport Transfer")}
> > > **Ride share** ${text("Ride Share")}
> > > **E-bikes & scooters** ${text("Micromobility")}
> > >
> > > **Safety**
> > > \`\`\`meta-bind
> > > INPUT[textArea(class(travel-safety)):Safety]
> > > \`\`\`
> >
> > \`\`\`view
> > Travel/panel { widgets: [
> >     { name: "onThePlan", input: { field: "Locale" } },
> >     { name: "stillToDo", input: { field: "Locale" } },
> >     { name: "history", input: { field: "Locale", stays: true } },
> >     { name: "trips", input: { field: "Locale", title: "Trips" } }
> > ] }
> > \`\`\`

---

## Places
![[${BASES}/Locale Places.base#Google rating]]

> [!columns|1-1]
> > [!col]
> > #### Neighbourhoods
> > \`\`\`view
> > Travel/neighbourhoods
> > \`\`\`
>
> > [!col]
> > #### Nearby Cities & Regions
> > \`\`\`view
> > Travel/nearby
> > \`\`\`

---

\`\`\`mapview
${JSON.stringify({ name: "Default", mapZoom: 11, centerLat: lat ?? 0, centerLng: lng ?? 0, query: `linkedto:"${noteName}" AND NOT path:"${cfg["Trips Folder"]}"`, chosenMapSource: MAP_SOURCE, autoFit: true, lock: false, showLinks: false, linkColor: "red", markerLabels: "off", embeddedHeight: 450 })}
\`\`\`
`;

    if (existing) await tp.app.vault.modify(existing, content);
    else await tp.app.vault.create(notePath, content);
    new Notice(`City note built: ${notePath}`, 6000);
} catch (e) {
    console.error("City Template failed", e);
    new Notice(`City Template failed: ${e.message}`, 8000);
}
%>
