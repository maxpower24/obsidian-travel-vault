<%*
/**
 * PROOF OF CONCEPT — compare cover images: Google Places photos vs Wikipedia lead image.
 * Saves images to _scripts/image-test/ and writes _scripts/Image Test Results.md (a gallery).
 * Keys from Keychain (google-places). Wikipedia needs no key.
 */
const OUT_DIR  = "_scripts/image-test";
const RESULTS  = "_scripts/Image Test Results.md";
const PHOTOS_PER_PLACE = 3;
const TARGETS = [
    { query: "Japan",     wiki: "Japan" },
    { query: "Australia", wiki: "Australia" },
    { query: "France",    wiki: "France" },
    { query: "Tokyo",     wiki: "Tokyo" },
    { query: "Melbourne", wiki: "Melbourne" },
    { query: "Kyoto",     wiki: "Kyoto" },
];

const http    = tp.user.sysHttp(tp);
const geo     = tp.user.sysGeo(tp);
const adapter = tp.app.vault.adapter;
const key     = geo.getGoogleApiKey();
const UA      = { "User-Agent": "ObsidianTravelVault/0.1 (personal test)" };

if (!(await adapter.exists(OUT_DIR))) await adapter.mkdir(OUT_DIR);

async function download(url, path, headers = {}) {
    const res = await tp.obsidian.requestUrl({ url, headers, throw: false });
    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status} for ${path}`);
    await adapter.writeBinary(path, res.arrayBuffer);
    return path.split("/").pop();
}

let md = "---\ncssclasses:\n  - full-width\n---\n# Image test results\n\n";

for (const t of TARGETS) {
    md += `## ${t.query}\n\n`;
    const slug = t.query.toLowerCase().replace(/\s+/g, "-");
    const row = [];

    // --- Google: Text Search -> photos -> media (skipHttpRedirect gives a direct photoUri)
    try {
        const search = await http.requestJson({
            url: "https://places.googleapis.com/v1/places:searchText",
            method: "POST",
            headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "places.id,places.displayName,places.types,places.photos" },
            body: { textQuery: t.query, pageSize: 1 },
        });
        const place  = search.json?.places?.[0];
        const photos = (place?.photos ?? []).slice(0, PHOTOS_PER_PLACE);
        md += `Google match: **${place?.displayName?.text ?? "none"}** (${(place?.types ?? []).slice(0, 3).join(", ")}), ${place?.photos?.length ?? 0} photos available\n\n`;

        for (let i = 0; i < photos.length; i++) {
            const media = await http.requestJson({
                url: `https://places.googleapis.com/v1/${photos[i].name}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${encodeURIComponent(key)}`,
            });
            if (!media.json?.photoUri) { row.push(`Google ${i + 1}: no photoUri (HTTP ${media.status})`); continue; }
            const file = await download(media.json.photoUri, `${OUT_DIR}/${slug}-google-${i + 1}.jpg`);
            row.push(`**Google ${i + 1}**<br>![[${file}\\|300]]`);
        }
    } catch (e) {
        row.push(`Google failed: ${e.message}`);
    }

    // --- Wikipedia lead image
    try {
        const summary = await http.requestJson({
            url: "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(t.wiki),
            headers: UA,
        });
        const src = summary.json?.originalimage?.source;
        if (src) {
            const ext  = (src.split("?")[0].split(".").pop() || "jpg").toLowerCase();
            const file = await download(src, `${OUT_DIR}/${slug}-wikipedia.${ext}`, UA);
            row.push(`**Wikipedia**<br>![[${file}\\|300]]`);
        } else {
            row.push("Wikipedia: no image");
        }
    } catch (e) {
        row.push(`Wikipedia failed: ${e.message}`);
    }

    md += "| " + row.map((_, i) => `Option ${i + 1}`).join(" | ") + " |\n";
    md += "| " + row.map(() => "---").join(" | ") + " |\n";
    md += "| " + row.join(" | ") + " |\n\n";
}

const existing = tp.app.vault.getAbstractFileByPath(RESULTS);
if (existing) await tp.app.vault.modify(existing, md); else await tp.app.vault.create(RESULTS, md);
new Notice("Image test done — open _scripts/Image Test Results.md", 6000);
%>
