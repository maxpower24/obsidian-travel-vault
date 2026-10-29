<%*
/**
 * Country Template — build or rebuild a Country note from live APIs
 * (REST Countries v5, Wikipedia, Google Places photos and timezone).
 * - Prompts for an ISO alpha-2 code and writes <Countries Folder>/<Country>.md.
 * - Re-running keeps what you've entered (Wishlist, Plugs, Packing, Notes…) and refreshes the rest.
 * - Cover chosen ONCE: a pop-up shows thumbnails; the pick becomes <CC>.jpg (Banner), the others are deleted.
 *   Dismiss = Photo 1. Re-running skips the pop-up once <CC>.jpg exists.
 * - Flag SVG saved once to the flags folder and used as the Pretty Properties icon.
 * Paths and secret IDs come from the travel config note. Widgets are shared views in 98 - Meta/Views/Travel
 * (they read home settings from the config live, so editing a view updates every note without a rebuild).
 */
const CONFIG_PATH = "98 - Meta/System/Travel/_config.md";
const cfg  = tp.user.sysConfig(tp).loadConfig(CONFIG_PATH);
const need = (k) => { if (cfg[k] === undefined || cfg[k] === null || cfg[k] === "") throw new Error(`"${k}" is not set in ${CONFIG_PATH}`); return cfg[k]; };

const COUNTRIES   = need("Countries Folder");
const BASES       = need("Bases Folder");
const IMG_DIR     = need("Country Images Folder");
const FLAG_DIR    = need("Flags Folder");
const GOOGLE_ID   = need("Google Secret");
const RC_ID       = need("REST Countries Secret");
const MAP_SOURCE  = Number(cfg["Map Source Index"] ?? 0);
const CANDIDATES  = Number(cfg["Cover Candidates"] ?? 3);
const BANNER_KEY  = "Banner";   // must match the Pretty Properties banner property
const ICON_KEY    = "Icon";     // must match the Pretty Properties icon property
const DEST_HEADER = "Cities & Regions";
const NAV_VIEW    = "98 - Meta/Views/nav";   // shared navigation bar

const http    = tp.user.sysHttp(tp);
const geo     = tp.user.sysGeo(tp);
const secrets = tp.user.sysSecrets(tp);
const adapter = tp.app.vault.adapter;
const UA      = { "User-Agent": "ObsidianTravelVault/0.1 (personal vault)" };

const input = await tp.system.prompt("Country code (ISO alpha-2)", "JP");
if (!input) return;
const code = input.trim().toUpperCase();

async function ensureDir(p) { if (!(await adapter.exists(p))) await adapter.mkdir(p); }   // creates parent folders too
async function download(url, path, headers = {}) {
    const res = await tp.obsidian.requestUrl({ url, headers, throw: false });
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status} downloading ${path}`);
    await adapter.writeBinary(path, res.arrayBuffer);
    return path;
}
const q   = (v) => JSON.stringify(v ?? "");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

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
    // ---- REST Countries
    const rc = await http.requestJson({
        url: `https://api.restcountries.com/countries/v5/codes.alpha_2/${code}`,
        headers: { Authorization: `Bearer ${secrets.getSecret(RC_ID)}` },
    });
    const c = rc.json?.data?.objects?.[0];
    if (!c) throw new Error(`REST Countries returned nothing for ${code} (HTTP ${rc.status})`);

    const name      = c.names.common;
    const native    = Object.values(c.names.native ?? {})[0]?.common ?? "";
    const capital   = c.capitals?.find((x) => x.attributes?.primary)?.name ?? c.capitals?.[0]?.name ?? "";
    const region    = c.subregion ?? c.region ?? "";
    const currency  = (c.currencies ?? []).map((x) => `${x.code} · ${x.name} · ${x.symbol}`).join(" / ");
    const languages = (c.languages ?? []).map((x) => x.name).join(", ");
    const calling   = (c.calling_codes ?? []).map((x) => `+${x}`).join(", ");
    const driving   = cap(c.cars?.driving_side);
    const zones     = (c.timezones ?? []).join(", ");
    const units     = [c.units?.measurement_system, c.units?.temperature_scale].filter(Boolean).map(cap).join(" · ");

    // ---- Flag (once)
    await ensureDir(FLAG_DIR);
    const flagPath = `${FLAG_DIR}/${code}.svg`;
    if (!(await adapter.exists(flagPath)) && c.flag?.url_svg) await download(c.flag.url_svg, flagPath);
    const flag = (await adapter.exists(flagPath)) ? flagPath : "";

    // ---- Cover: choose once
    const coverDir   = `${IMG_DIR}/${code}`;
    const finalCover = `${coverDir}/${code}.jpg`;
    await ensureDir(coverDir);

    let cover = "";
    if (await adapter.exists(finalCover)) {
        cover = finalCover;                                   // already chosen earlier
    } else {
        let cands = [];
        for (let i = 1; i <= CANDIDATES; i++) {
            const p = `${coverDir}/${code}-${i}.jpg`;
            if (await adapter.exists(p)) cands.push(p);       // reuse candidates from an earlier run
        }
        if (cands.length === 0) {
            const key = geo.getGoogleApiKey(GOOGLE_ID);
            const search = await http.requestJson({
                url: "https://places.googleapis.com/v1/places:searchText",
                method: "POST",
                headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.photos" },
                body: { textQuery: name, pageSize: 1 },
            });
            const photos = (search.json?.places?.[0]?.photos ?? []).slice(0, CANDIDATES);
            for (let i = 0; i < photos.length; i++) {
                const media = await http.requestJson({
                    url: `https://places.googleapis.com/v1/${photos[i].name}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${encodeURIComponent(key)}`,
                });
                if (media.json?.photoUri) cands.push(await download(media.json.photoUri, `${coverDir}/${code}-${i + 1}.jpg`));
            }
        }
        if (cands.length > 0) {
            const idx = cands.length === 1 ? 0 : await pickImage(cands, `Choose a cover for ${name}`);
            await adapter.rename(cands[idx], finalCover);
            for (const p of cands) if (p !== cands[idx] && (await adapter.exists(p))) await adapter.remove(p);
            cover = finalCover;
        }
    }

    // ---- Wikipedia
    const wiki = await http.requestJson({
        url: "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(name),
        headers: UA,
    });
    const extract = (wiki.json?.extract ?? "").replace(/\n/g, " ");
    const centre  = wiki.json?.coordinates ?? null;   // {lat, lon} for the map

    // ---- Capital's IANA timezone (for the local time widget)
    let capitalTz = "";
    if (capital) {
        const tzRes = await http.requestJson({
            url: "https://places.googleapis.com/v1/places:searchText",
            method: "POST",
            headers: { "X-Goog-Api-Key": geo.getGoogleApiKey(GOOGLE_ID), "X-Goog-FieldMask": "places.timeZone" },
            body: { textQuery: `${capital}, ${name}`, pageSize: 1 },
        });
        capitalTz = tzRes.json?.places?.[0]?.timeZone?.id ?? "";
    }
    const currencyCodes = (c.currencies ?? []).map((x) => x.code);
    const wikiUrl = wiki.json?.content_urls?.desktop?.page ?? "";

    // ---- Keep user-entered values from an existing note
    await ensureDir(COUNTRIES);
    const notePath = `${COUNTRIES}/${name}.md`;
    const existing = tp.app.vault.getAbstractFileByPath(notePath);
    const old  = existing ? (tp.app.metadataCache.getFileCache(existing)?.frontmatter ?? {}) : {};
    const keep = (k, d = "") => (old[k] !== undefined && old[k] !== null ? old[k] : d);

    const plugOptions = "ABCDEFGHIJKLMNO".split("").map((p) => `option(${p})`).join(", ");
    const tipOptions  = ["Not expected", "Appreciated", "Expected", "Considered rude"].map((t) => `option(${t})`).join(", ");

    const content = `---
Type: Country
Country Code: ${q(code)}
Region: ${q(region)}
Currency Codes: ${JSON.stringify(currencyCodes)}
${BANNER_KEY}: ${q(cover ? `[[${cover}]]` : "")}
${ICON_KEY}: ${q(flag ? `[[${flag}]]` : "")}
Wishlist: ${keep("Wishlist", false)}
Plugs: ${JSON.stringify(keep("Plugs", []))}
Packing: ${JSON.stringify(keep("Packing", []))}
Emergency Number: ${q(keep("Emergency Number"))}
Tipping: ${q(keep("Tipping"))}
Visa: ${q(keep("Visa"))}
Vaccine: ${q(keep("Vaccine", keep("Vaccines")))}
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
Travel/status { field: "Country" }
\`\`\`

> [!columns|1-2.5-1 centre-first stretch]
> > [!col]
> > > [!col|box]
> > > **Capital** ${capital ? `[[${capital}, ${name}]]` : "—"}
> > > **Region** ${region}
> > > **Currency** ${currency}
> > > **Languages** ${languages}
> > > **Calling code** ${calling}
> > > **Driving side** ${driving}
> > > **Timezones** ${zones}
> > > **Units** ${units}
> > > **Names** ${c.names.official}${native ? ` · ${native}` : ""}
> >
> > \`\`\`view
> > Travel/panel { widgets: [
> >     { name: "fx", input: { codes: ${JSON.stringify(currencyCodes)} } },
> >     { name: "localTime", input: ${JSON.stringify({ tz: capitalTz, place: capital })} },
> >     { name: "holidays", input: { cc: "${code}", title: "Holidays" } }
> > ] }
> > \`\`\`
>
> > [!col|fill]
> > ${extract}
> > ${wikiUrl ? `[Wikipedia](${wikiUrl})` : ""}
> >
> > **Routine Packing List**
> > \`\`\`meta-bind
> > INPUT[list:Packing]
> > \`\`\`
> >
> > **Notes**
> > \`\`\`meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > \`\`\`
>
> > [!col]
> > > [!todo] Local Essentials
> > > **Plugs** \`INPUT[inlineListSuggester(${plugOptions}):Plugs]\`
> > > **Emergency** \`INPUT[text:["Emergency Number"]]\`
> > > **Tipping** \`INPUT[inlineSelect(${tipOptions}):Tipping]\`
> >
> > > [!info] Entry & Health
> > > [Smartraveller: ${name}](https://www.smartraveller.gov.au/search?search=${encodeURIComponent(name)})
> > > **Visa** \`INPUT[text:Visa]\`
> > > **Vaccine** \`INPUT[text:Vaccine]\`
> >
> > \`\`\`view
> > Travel/panel { widgets: [
> >     { name: "onThePlan", input: { field: "Country", limit: 5 } },
> >     { name: "history", input: { field: "Country" } },
> >     { name: "trips", input: { field: "Country", title: "Trips" } }
> > ] }
> > \`\`\`

---

## ${DEST_HEADER}
![[${BASES}/Locales.base#Cities & Regions]]


> [!columns|1-1-1]
> > [!col]
> > #### Food & Drink
> > ![[${BASES}/Food and Drink.base#Top rated]]
>
> > [!col]
> > #### Accommodation
> > ![[${BASES}/Accommodation.base#Top rated]]
>
> > [!col]
> > #### Attractions
> > ![[${BASES}/Attractions.base#Top rated]]

---

\`\`\`mapview
${JSON.stringify({ name: "Default", mapZoom: 5, centerLat: centre?.lat ?? 0, centerLng: centre?.lon ?? 0, query: `linkedto:"${name}" AND NOT path:"${cfg["Trips Folder"]}"`, chosenMapSource: MAP_SOURCE, autoFit: true, lock: false, showLinks: false, linkColor: "red", markerLabels: "off", embeddedHeight: 450 })}
\`\`\`
`;

    if (existing) await tp.app.vault.modify(existing, content);
    else await tp.app.vault.create(notePath, content);
    new Notice(`Country note built: ${notePath}`, 6000);
} catch (e) {
    console.error("Country Template failed", e);
    new Notice(`Country Template failed: ${e.message}`, 8000);
}
%>
