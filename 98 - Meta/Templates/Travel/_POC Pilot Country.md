<%*
/**
 * PILOT v3 — build a Country note from live APIs (REST Countries v5, Wikipedia, Google Places photos).
 * - Cover chosen ONCE: pop-up with 3 thumbnails; pick becomes <CC>.jpg + Banner, the others are deleted.
 *   (Dismiss = Photo 1. Re-running skips the pop-up once <CC>.jpg exists.)
 * - Layout: [1-2.5-1] Essentials · About · (Fill in over Before you go) → Locales cards (full width)
 *           → [1-1-1] Food & Drink · Accommodation · Attractions cards → My notes.
 * - Flag: REST Countries SVG saved once to the flags folder; used as the Pretty Properties icon and above Essentials.
 * Writes _scripts/pilot/<Country>.md (overwrites; keeps user-entered values and `Expected`).
 */
const PILOT_DIR  = "_scripts/pilot";
const BASES      = `${PILOT_DIR}/bases`;
const IMG_DIR    = `${PILOT_DIR}/images`;
const CANDIDATES = 3;
const BANNER_KEY = "Banner";
const MAP_SOURCE = 1;          // index of MapTiler in Map View's map sources list (0 = first)
const DEST_HEADER = "Cities & Regions";
const ICON_KEY   = "Icon";     // must match Pretty Properties icon property setting
const FLAG_DIR   = `${IMG_DIR}/flags`;   // final vault: 06 - Resources/Images/Icons/Flags

const http    = tp.user.sysHttp(tp);
const geo     = tp.user.sysGeo(tp);
const secrets = tp.user.sysSecrets(tp);
const adapter = tp.app.vault.adapter;
const UA      = { "User-Agent": "ObsidianTravelVault/0.1 (personal pilot)" };

const input = await tp.system.prompt("Country code (ISO alpha-2)", "JP");
if (!input) return;
const code = input.trim().toUpperCase();

async function ensureDir(p) { if (!(await adapter.exists(p))) await adapter.mkdir(p); }
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
        headers: { Authorization: `Bearer ${secrets.getSecret("rest-countries")}` },
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
    await ensureDir(IMG_DIR); await ensureDir(FLAG_DIR);
    const flagPath = `${FLAG_DIR}/${code}.svg`;
    if (!(await adapter.exists(flagPath)) && c.flag?.url_svg) await download(c.flag.url_svg, flagPath);
    const flag = (await adapter.exists(flagPath)) ? flagPath : "";

    // ---- Cover: choose once
    const coverDir   = `${IMG_DIR}/${code}`;
    const finalCover = `${coverDir}/${code}.jpg`;
    await ensureDir(IMG_DIR); await ensureDir(coverDir);

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
            const key = geo.getGoogleApiKey();
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
            headers: { "X-Goog-Api-Key": geo.getGoogleApiKey(), "X-Goog-FieldMask": "places.timeZone" },
            body: { textQuery: `${capital}, ${name}`, pageSize: 1 },
        });
        capitalTz = tzRes.json?.places?.[0]?.timeZone?.id ?? "";
    }
    const currencyCodes = (c.currencies ?? []).map((x) => x.code);
    const wikiUrl = wiki.json?.content_urls?.desktop?.page ?? "";

    // ---- Keep user-entered values from an existing note
    const notePath = `${PILOT_DIR}/${name}.md`;
    const existing = tp.app.vault.getAbstractFileByPath(notePath);
    const old  = existing ? (tp.app.metadataCache.getFileCache(existing)?.frontmatter ?? {}) : {};
    const keep = (k, d = "") => (old[k] !== undefined && old[k] !== null ? old[k] : d);

    const plugOptions = "ABCDEFGHIJKLMNO".split("").map((p) => `option(${p})`).join(", ");
    const tipOptions  = ["Not expected", "Appreciated", "Expected", "Considered rude"].map((t) => `option(${t})`).join(", ");

    const content = `---
Type: Country
Country Code: ${q(code)}
Region: ${q(region)}
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
${old.Expected ? `Expected: ${q(old.Expected)}\n` : ""}cssclasses:
  - full-width
  - location-note
  - hide-properties
---
\`\`\`dataviewjs
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const itins  = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country));
const places = dv.pages().where((p) => p.Type === "Place" && here(p.Country));
const past     = itins.where((i) => i.End && dv.date(i.End) < now);
const upcoming = itins.where((i) => !i.End || dv.date(i.End) >= now);
const status = (past.length || places.where((p) => p.Visited).length) ? "Visited"
             : upcoming.length ? "Planned"
             : (cur.Wishlist || places.length) ? "Saved" : "Reference";
// next visit = earliest upcoming itinerary in this country (dated first), via its trip
const next = upcoming.sort((i) => i.Start ? dv.date(i.Start).toMillis() : Number.MAX_SAFE_INTEGER, "asc").first();
let nextText = "";
if (next) {
    const trip = next.Trip ? dv.page(next.Trip) : null;
    const start = next.Start ? dv.date(next.Start) : (trip?.Start ? dv.date(trip.Start) : null);
    const name = trip ? \`[[\${trip.file.path}|\${trip.file.name}]]\` : next.file.link;
    if (start && start <= now) nextText = \`Now · \${name}\`;
    else if (start) nextText = \`Next visit: \${name} · in \${Math.ceil(start.diff(now, "days").days)} days\`;
    else nextText = \`Next visit: \${name} · dates TBC\`;
}
const el = dv.el("div", "", { cls: "travel-status-bar" });
dv.paragraph(\`<span class="travel-status travel-status-\${status.toLowerCase()}">\${status}</span>\${nextText ? " · " + nextText : ""}\`, { container: el });
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
> > > [!col|box]
> > > \`\`\`dataviewjs
> > > const BASE = "AUD";
> > > const CODES = ${JSON.stringify(currencyCodes)};
> > > const KEY = "travel-vault-fx-" + BASE;
> > > const el = dv.el("div", "Loading exchange rate…");
> > > (async () => {
> > >     let data = null;
> > >     try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
> > >     const fresh = data && Date.now() / 1000 < data.time_next_update_unix;
> > >     if (!fresh) {
> > >         try {
> > >             const res = await fetch("https://open.er-api.com/v6/latest/" + BASE);
> > >             const json = await res.json();
> > >             if (json.result === "success") { data = json; localStorage.setItem(KEY, JSON.stringify(json)); }
> > >         } catch (e) { console.error("FX fetch failed", e); }
> > >     }
> > >     if (!data?.rates) { el.setText("Exchange rate unavailable"); return; }
> > >     const fmt = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: n < 10 ? 2 : 0 });
> > >     const lines = CODES.filter((c) => data.rates[c]).flatMap((c) => {
> > >         const r = data.rates[c], unit = Math.pow(10, Math.max(0, Math.round(Math.log10(r))));
> > >         return [\`**1 \${BASE}** ≈ \${fmt(r)} \${c}\`, \`**\${unit.toLocaleString("en-AU")} \${c}** ≈ \${fmt(unit / r)} \${BASE}\`];
> > >     });
> > >     const day = new Date(data.time_last_update_unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
> > >     el.empty();
> > >     dv.paragraph((lines.length ? lines.join("<br>") : "No rate for " + CODES.join(", ")) + \`<br><small>Updated \${day}</small>\`, { container: el });
> > > })();
> > > \`\`\`
> >
> > > [!col|box]
> > > \`\`\`dataviewjs
> > > const TZ = "${capitalTz}", HOME = "Australia/Melbourne", PLACE = "${capital}";
> > > if (!TZ) { dv.paragraph("Local time unavailable"); } else {
> > >     const off = (tz, d) => { const v = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName").value; const m = v.match(/GMT([+-])(\\d+)(?::(\\d+))?/); if (!m) return 0; const n = +m[2] * 60 + +(m[3] || 0); return m[1] === "-" ? -n : n; };
> > >     const el = dv.el("div", "");
> > >     const render = () => {
> > >         const now = new Date();
> > >         const t = now.toLocaleTimeString("en-AU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
> > >         const d = now.toLocaleDateString("en-AU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
> > >         const diff = off(TZ, now) - off(HOME, now), h = Math.abs(diff) / 60;
> > >         const rel = diff === 0 ? "same as Melbourne" : \`\${Number.isInteger(h) ? h : h.toFixed(1)} h \${diff > 0 ? "ahead of" : "behind"} Melbourne\`;
> > >         el.innerHTML = \`<div style="font-size:1.8em;font-weight:600;line-height:1.1">\${t}</div><div>\${PLACE} · \${d}</div><small>\${rel}</small>\`;
> > >     };
> > >     render();
> > >     const timer = setInterval(() => { if (!el.isConnected) clearInterval(timer); else render(); }, 30000);
> > > }
> > > \`\`\`
> >
> > > [!col|box]
> > > **Holidays**
> > > \`\`\`dataviewjs
> > > const CC = "${code}";
> > > const GOOGLE_IDS = { TH: "en.th", TW: "en.taiwan" };   // fallback map (final: config)
> > > const cur = dv.current();
> > > const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > // trip windows in this country, for highlighting
> > > const windows = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country) && p.Trip)
> > >     .map((i) => dv.page(i.Trip)).filter((t) => t && t.Start && t.End)
> > >     .map((t) => ({ name: t.file.name, start: dv.date(t.Start).toISODate(), end: dv.date(t.End).toISODate() })).array();
> > > const el = dv.el("div", "Loading…");
> > > (async () => {
> > >     let list = [];
> > >     try {
> > >         const res = await fetch(\`https://date.nager.at/api/v3/NextPublicHolidays/\${CC}\`);
> > >         if (res.ok) list = (await res.json()).filter((h) => h.global).map((h) => ({ date: h.date, name: h.name }));
> > >     } catch (e) {}
> > >     if (!list.length && GOOGLE_IDS[CC]) {
> > >         try {
> > >             const id = encodeURIComponent(GOOGLE_IDS[CC] + "#holiday@group.v.calendar.google.com");
> > >             const txt = await (await fetch(\`https://calendar.google.com/calendar/ical/\${id}/public/basic.ics\`)).text();
> > >             const today = new Date().toISOString().slice(0, 10);
> > >             list = txt.replace(/\\r?\\n[ \\t]/g, "").split("BEGIN:VEVENT").slice(1).map((b) => {
> > >                 const g = (k) => (b.match(new RegExp(\`^\${k}[^:]*:(.*)$\`, "m")) || [])[1]?.trim() ?? "";
> > >                 const d = g("DTSTART");
> > >                 return { date: \`\${d.slice(0, 4)}-\${d.slice(4, 6)}-\${d.slice(6, 8)}\`, name: g("SUMMARY"), pub: g("DESCRIPTION").startsWith("Public holiday") };
> > >             }).filter((h) => h.pub && h.date >= today).sort((a, b) => a.date.localeCompare(b.date));
> > >         } catch (e) {}
> > >     }
> > >     el.empty();
> > >     if (!list.length) { el.setText("No holiday data"); return; }
> > >     const inTrip = (d) => windows.find((w) => d >= w.start && d <= w.end);
> > >     const shown = [...list.slice(0, 3), ...list.slice(3).filter((h) => inTrip(h.date))];
> > >     const fmt = (d) => new Date(d + "T00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
> > >     dv.paragraph(shown.map((h) => { const t = inTrip(h.date); return \`\${fmt(h.date)} · \${h.name}\${t ? \` <small>(during \${t.name})</small>\` : ""}\`; }).join("<br>"), { container: el });
> > > })();
> > > \`\`\`
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
> > > [!col|box]
> > > \`\`\`dataviewjs
> > > const cur = dv.current();
> > > const isHere = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > const places = dv.pages().where((p) => p.Type === "Place" && isHere(p.Country));
> > > const itins  = dv.pages().where((p) => p.Type === "Itinerary" && isHere(p.Country));
> > > const trips  = new Set(itins.map((i) => i.Trip && dv.page(i.Trip)?.file.path).filter(Boolean).array());
> > > const now = dv.date("now");
> > > const dates = [
> > >     ...places.where((p) => p.Visited && p["Last Visited"]).map((p) => dv.date(p["Last Visited"])).array(),
> > >     ...itins.where((i) => i.End && dv.date(i.End) < now).map((i) => dv.date(i.End)).array(),
> > > ].filter(Boolean).sort((a, b) => b - a);
> > > dv.paragraph([
> > >     \`**Places saved** \${places.length}\`,
> > >     \`**Places visited** \${places.where((p) => p.Visited).length}\`,
> > >     \`**Last visited** \${dates.length ? dates[0].toFormat("MMM yyyy") : "never"}\`,
> > > ].join("<br>"));
> > > \`\`\`
> >
> > > [!col|box]
> > > **Trips**
> > > \`\`\`dataviewjs
> > > const cur = dv.current();
> > > const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > const now = dv.date("now");
> > > const tripStatus = (t) => {
> > >     if (t.Cancelled) return "Cancelled";
> > >     if (!t.Start) return "Idea";
> > >     if (t.End && dv.date(t.End) < now) return "Done";
> > >     if (dv.date(t.Start) <= now) return "Active";
> > >     return t.Booked ? "Booked" : "Planning";
> > > };
> > > const seen = new Set();
> > > const trips = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country) && p.Trip)
> > >     .map((i) => dv.page(i.Trip)).filter((t) => t && !seen.has(t.file.path) && seen.add(t.file.path))
> > >     .sort((t) => t.Start ? dv.date(t.Start).toMillis() : 0, "desc");
> > > if (!trips.length) dv.paragraph("No trips yet");
> > > else dv.paragraph(trips.map((t) => {
> > >     const range = t.Start ? \`\${dv.date(t.Start).toFormat("d MMM yyyy")}\${t.End ? " – " + dv.date(t.End).toFormat("d MMM yyyy") : ""}\` : "dates TBC";
> > >     return \`\${t.file.link} · \${range} · \${tripStatus(t)}\`;
> > > }).join("<br>"));
> > > \`\`\`

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
${JSON.stringify({ name: "Default", mapZoom: 5, centerLat: centre?.lat ?? 0, centerLng: centre?.lon ?? 0, query: `linkedto:"${name}"`, chosenMapSource: MAP_SOURCE, autoFit: true, lock: false, showLinks: false, linkColor: "red", markerLabels: "off", embeddedHeight: 450 })}
\`\`\`
`;

    if (existing) await tp.app.vault.modify(existing, content);
    else await tp.app.vault.create(notePath, content);
    new Notice(`Pilot country built: ${notePath}`, 6000);
} catch (e) {
    console.error("Pilot country failed", e);
    new Notice(`Pilot country failed: ${e.message}`, 8000);
}
%>
