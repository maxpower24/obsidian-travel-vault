/**
 * nav.js — shared navigation bar for every note in the vault (Dataview view).
 * Embed at the top of a note:
 *     ```dataviewjs
 *     await dv.view("98 - Meta/Views/nav")
 *     ```
 * Line 1: breadcrumb (left) · module extra, e.g. the current trip (right)
 * Line 2: previous (left) · next (right) — only when the module supplies them
 *
 * Shared half: Home › one crumb per folder down to the module's root (Home › Areas › Travel).
 * Module half: a rules file named in the module's config (`Nav Rules`), found by matching the
 * note's path against `Module Root` in each 98 - Meta/System/<Module>/_config.md.
 * Notes outside any module, or that the rules don't recognise, get a plain folder breadcrumb.
 *
 * Lives outside 98 - Meta/System on purpose: Templater loads every .js in that folder as a user script.
 */
const HOME       = "Home.md";
const CONFIG_DIR = "98 - Meta/System";

const page = dv.current();
if (!page) return;
const here = page.file.path;

// ---- helpers shared with module rules
const nameOf     = (p) => p.split("/").pop().replace(/\.md$/, "");
const label      = (p) => nameOf(p).replace(/^\d+\s*-\s*/, "");          // "05 - Areas" → "Areas"
const folderNote = (folder) => `${folder}/${nameOf(folder)}.md`;          // Folder Notes: same name, inside
const exists     = (p) => !!app.vault.getAbstractFileByPath(p);
const linkPage   = (l) => (l ? dv.page(l.path ?? l) : null);
const fn = { nameOf, label, folderNote, exists, linkPage };

/** Crumbs for each folder strictly below `from` down to (and including) `to`. */
function folderCrumbs(from, to) {
    const parts = to.split("/").filter(Boolean);
    const start = from ? from.split("/").filter(Boolean).length : 0;
    const out = [];
    for (let i = start; i < parts.length; i++) {
        const folder = parts.slice(0, i + 1).join("/");
        const note = folderNote(folder);
        out.push({ path: exists(note) ? note : null, label: label(folder) });
    }
    return out;
}

const parent = here.includes("/") ? here.slice(0, here.lastIndexOf("/")) : "";

// ---- find this note's module
const mod = dv.pages(`"${CONFIG_DIR}"`)
    .where((p) => p.file.name === "_config" && p["Module Root"])
    .find((p) => here.startsWith(p["Module Root"] + "/"));

let crumbs = here === HOME ? [] : [{ path: exists(HOME) ? HOME : null, label: "Home" }];
let current = here === folderNote(parent) ? label(parent) : page.file.name;   // folder notes drop the "05 - " prefix
let right = null, prev = null, next = null;

if (mod) {
    const root = mod["Module Root"];
    crumbs.push(...folderCrumbs("", root));

    let result = null;
    const rulesPath = mod["Nav Rules"];
    if (rulesPath) {
        try {
            const rf = app.vault.getAbstractFileByPath(rulesPath);
            const cache = ((window.travelVault ??= {}).nav ??= {});
            if (cache[rulesPath]?.mtime !== rf.stat.mtime) {
                const m = { exports: {} };
                new Function("module", "exports", await app.vault.cachedRead(rf))(m, m.exports);
                cache[rulesPath] = { mtime: rf.stat.mtime, rules: m.exports };
            }
            result = await cache[rulesPath].rules({ dv, page, config: mod, fn });
        } catch (e) {
            console.error(`nav: rules failed (${rulesPath})`, e);
        }
    }

    if (result?.crumbs) crumbs.push(...result.crumbs);
    else crumbs.push(...folderCrumbs(root, parent));
    if (result?.current) current = result.current;
    ({ right = null, prev = null, next = null } = result ?? {});
} else if (here !== HOME) {
    crumbs.push(...folderCrumbs("", parent));
}

// the note itself is always the last crumb, so drop any crumb that points at it (e.g. a folder note)
crumbs = crumbs.filter((c) => c.path !== here);

// ---- render
const link = (c) => (c.path ? `[[${c.path}|${c.label}]]` : c.label);
const bar  = dv.el("div", "", { cls: "vault-nav" });

const line1 = bar.createDiv({ cls: "vault-nav-line" });
const trail = [...crumbs.map(link), `<span class="vault-nav-current">${current}</span>`].join(" › ");
dv.span(trail, { container: line1.createDiv({ cls: "vault-nav-crumbs" }) });
if (right) dv.span(right, { container: line1.createDiv({ cls: "vault-nav-right" }) });

if (prev || next) {
    const line2 = bar.createDiv({ cls: "vault-nav-line" });
    dv.span(prev ? `← ${prev}` : "", { container: line2.createDiv({ cls: "vault-nav-prev" }) });
    dv.span(next ? `${next} →` : "", { container: line2.createDiv({ cls: "vault-nav-next" }) });
}
