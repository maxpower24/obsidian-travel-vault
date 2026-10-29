/*
 * Vault Views — a small, fast engine for the vault's widget scripts.
 *
 * Notes use blocks like:
 *     ```view
 *     Travel/panel { widgets: ["countdown", "tripEssentials"] }
 *     ```
 * The first word is a script under "98 - Meta/Views" (here 98 - Meta/Views/Travel/panel.js); anything after it
 * is the script's `input` (a JS object literal). Scripts stay ordinary files in the vault, so editing a
 * widget needs no rebuild: the plugin recompiles a script whenever its file changes.
 *
 * Scripts get a `dv` object compatible with the parts of Dataview the widgets use (current, page, pages,
 * date, el, span, paragraph, view, container) plus `dv.tasks()` and `dv.revision`, all served from the
 * plugin's own in-memory index of Obsidian's metadata cache — no Dataview needed.
 *
 * Blocks render the moment the note renders, and re-render (debounced) only when a note changes in a way
 * that matters (frontmatter or task state; typing in "My Notes" doesn't count).
 * Command "Vault Views: show render timings" lists how long each block took.
 */
"use strict";
const obsidian = require("obsidian");

const VIEWS_ROOT = "98 - Meta/Views";
const IGNORE_KEYS = new Set(["My Notes"]);   // frontmatter changes that never need a re-render
const REFRESH_MS = 1500;

/* ------------------------------------------------------------------ dates (luxon-like, over moment) */
const LUXON_TOKENS = /yyyy|yy|LLLL|LLL|MMMM|MMM|MM|cccc|ccc|EEE|dd|d|HH|H|mm|a/g;
const TO_MOMENT = { yyyy: "YYYY", yy: "YY", LLLL: "MMMM", LLL: "MMM", MMMM: "MMMM", MMM: "MMM", MM: "MM",
    cccc: "dddd", ccc: "ddd", EEE: "ddd", dd: "DD", d: "D", HH: "HH", H: "H", mm: "mm", a: "A" };
class DT {
    constructor(m) { this.m = m; }
    static of(x) {
        if (x === null || x === undefined || x === "") return null;
        if (x instanceof DT) return x;
        if (x === "now") return new DT(window.moment());
        if (x === "today") return new DT(window.moment().startOf("day"));
        if (x instanceof Date || typeof x === "number") return new DT(window.moment(x));
        const m = window.moment(String(x), window.moment.ISO_8601);
        return m.isValid() ? new DT(m) : null;
    }
    toISODate() { return this.m.format("YYYY-MM-DD"); }
    toMillis() { return this.m.valueOf(); }
    valueOf() { return this.m.valueOf(); }
    plus(d) { const n = this.m.clone(); for (const [k, v] of Object.entries(d)) n.add(v, k); return new DT(n); }
    minus(d) { const n = this.m.clone(); for (const [k, v] of Object.entries(d)) n.subtract(v, k); return new DT(n); }
    diff(o, unit = "milliseconds") { const v = this.m.diff(DT.of(o).m, unit, true); return { [unit]: v, days: unit === "days" ? v : this.m.diff(DT.of(o).m, "days", true) }; }
    startOf(u) { return new DT(this.m.clone().startOf(u)); }
    endOf(u) { return new DT(this.m.clone().endOf(u)); }
    toFormat(f) {
        // luxon tokens → moment tokens; anything else is kept literally
        const parts = []; let last = 0;
        f.replace(LUXON_TOKENS, (t, i) => { if (i > last) parts.push(`[${f.slice(last, i)}]`); parts.push(TO_MOMENT[t]); last = i + t.length; return t; });
        if (last < f.length) parts.push(`[${f.slice(last)}]`);
        return this.m.format(parts.join(""));
    }
    get year() { return this.m.year(); }
    get month() { return this.m.month() + 1; }
    get day() { return this.m.date(); }
    get hour() { return this.m.hour(); }
    get minute() { return this.m.minute(); }
    toString() { return this.m.format(); }
}

/* ------------------------------------------------------------------ arrays (Dataview DataArray subset) */
class DataArray {
    constructor(values) { this.values = values; }
    get length() { return this.values.length; }
    [Symbol.iterator]() { return this.values[Symbol.iterator](); }
    array() { return [...this.values]; }
    where(f) { return new DataArray(this.values.filter(f)); }
    filter(f) { return this.where(f); }
    map(f) { return new DataArray(this.values.map(f)); }
    flatMap(f) { return new DataArray(this.values.flatMap(f)); }
    forEach(f) { this.values.forEach(f); }
    find(f) { return this.values.find(f); }
    findIndex(f) { return this.values.findIndex(f); }
    some(f) { return this.values.some(f); }
    every(f) { return this.values.every(f); }
    includes(x) { return this.values.includes(x); }
    join(s) { return this.values.join(s); }
    first() { return this.values[0]; }
    last() { return this.values[this.values.length - 1]; }
    limit(n) { return new DataArray(this.values.slice(0, n)); }
    slice(a, b) { return new DataArray(this.values.slice(a, b)); }
    concat(o) { return new DataArray(this.values.concat(o instanceof DataArray ? o.values : o)); }
    distinct(f = (x) => x) { const seen = new Set(); return this.where((x) => { const k = f(x); if (seen.has(k)) return false; seen.add(k); return true; }); }
    sort(key = (x) => x, dir = "asc") {
        const mul = dir === "desc" ? -1 : 1;
        const val = (x) => { const v = key(x); return v instanceof DT ? v.valueOf() : v; };
        return new DataArray([...this.values].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * mul; }));
    }
    groupBy(f) {
        const m = new Map();
        for (const v of this.values) { const k = f(v); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
        return new DataArray([...m.entries()].map(([key, rows]) => ({ key, rows: new DataArray(rows) })));
    }
}

/* ------------------------------------------------------------------ text → DOM (same subset as lib/dom.js) */
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const TAGS = /(<br\s*\/?>|<\/?small>|<\/?strong>|<\/span>|<\/div>|<span (?:class|style)="[^"<>]*">|<div (?:class|style)="[^"<>]*">)/g;
const inlineHtml = (s) => esc(s)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, p, t) => `<a class="internal-link" data-href="${p}" href="${p}">${t ?? p.split("/").pop().replace(/\.md$/, "")}</a>`)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="external-link" href="$2" target="_blank" rel="noopener">$1</a>');
const toHtml = (text) => String(text ?? "").split(TAGS).map((part, i) => (i % 2 ? part : inlineHtml(part))).join("");

/* ------------------------------------------------------------------ the plugin */
module.exports = class VaultViews extends obsidian.Plugin {
    async onload() {
        this.pages = new Map();        // path → page object (built lazily, dropped when the file changes)
        this.revision = 1;              // bumps on every relevant change; scripts use it as a cache key
        this.backlinks = null;          // target path → Set(source paths), rebuilt lazily after changes
        this.allPages = null;
        this.compiled = new Map();      // script path → { mtime, fn }
        this.mounted = new Set();       // live blocks
        this.timings = new Map();       // "note · view" → last render ms
        this.signatures = new Map();    // path → what we last saw (frontmatter minus ignored keys + tasks)

        this.registerMarkdownCodeBlockProcessor("view", (source, el, ctx) => {
            const child = new ViewBlock(this, source, el, ctx.sourcePath);
            ctx.addChild(child);
        });

        // listen for changes only once the vault has loaded (Obsidian fires a "create" for every file at startup)
        this.app.workspace.onLayoutReady(() => this.watch());

        this.addCommand({ id: "show-timings", name: "Show render timings", callback: () => this.showTimings() });
        this.addCommand({ id: "refresh", name: "Refresh all views", callback: () => { this.bump(); this.refreshAll(); } });
        this.addCommand({ id: "benchmark-note", name: "Benchmark this note", callback: () => this.benchmark() });
        this.addCommand({ id: "stress-create", name: "Stress test: create dummy notes", callback: () => new CountModal(this.app, 5000, (n) => this.stressCreate(n)).open() });
        this.addCommand({ id: "stress-delete", name: "Stress test: delete dummy notes", callback: () => this.stressDelete() });
    }

    watch() {
        const refresh = obsidian.debounce(() => this.refreshAll(), REFRESH_MS, true);
        this.registerEvent(this.app.metadataCache.on("changed", (file, _data, cache) => {
            this.pages.delete(file.path);
            const sig = this.signature(cache);
            if (this.signatures.get(file.path) === sig) return;   // e.g. typing in My Notes
            this.signatures.set(file.path, sig);
            this.bump(); refresh();
        }));
        this.registerEvent(this.app.vault.on("delete", (f) => { this.pages.delete(f.path); this.bump(); refresh(); }));
        this.registerEvent(this.app.vault.on("rename", (f, old) => { this.pages.delete(old); this.pages.delete(f.path); this.bump(); refresh(); }));
        this.registerEvent(this.app.vault.on("create", () => { this.bump(); refresh(); }));
        this.registerEvent(this.app.vault.on("modify", (f) => { if (f.path.startsWith(VIEWS_ROOT + "/")) { this.compiled.delete(f.path); refresh(); } }));
    }

    bump() { this.revision++; this.backlinks = null; this.allPages = null; }

    signature(cache) {
        const fm = { ...(cache?.frontmatter ?? {}) }; delete fm.position;
        for (const k of IGNORE_KEYS) delete fm[k];
        const tasks = (cache?.listItems ?? []).filter((l) => l.task !== undefined).map((l) => l.task).join("");
        return JSON.stringify(fm) + "|" + tasks + "|" + (cache?.links ?? []).map((l) => l.link).join(",");
    }

    refreshAll() { for (const b of this.mounted) b.render(); }

    showTimings() {
        const rows = [...this.timings.entries()].sort((a, b) => b[1] - a[1]);
        console.table(rows.map(([k, ms]) => ({ block: k, ms: Math.round(ms) })));
        const total = rows.reduce((n, r) => n + r[1], 0);
        new obsidian.Notice(`Vault Views: ${rows.length} blocks, ${Math.round(total)} ms total (details in the console)`, 8000);
    }

    /** Re-render each block of the open note one at a time, so each is timed alone (not competing with
     *  the rest of the note loading). Run it once the note has finished loading. */
    async benchmark() {
        const path = this.app.workspace.getActiveFile()?.path;
        const blocks = [...this.mounted].filter((b) => b.sourcePath === path);
        if (!blocks.length) { new obsidian.Notice("Vault Views: no view blocks on this note"); return; }
        const pass = async () => {
            const out = [];
            for (const b of blocks) { const t0 = performance.now(); await b.render(); out.push(performance.now() - t0); }
            return out;
        };
        // cold: throw away every cache (page objects, backlink index, anything keyed by revision) first
        this.pages.clear(); this.bump();
        const cold = await pass();
        const warm = await pass();
        const r1 = (n) => Math.round(n * 10) / 10;
        const files = this.app.vault.getMarkdownFiles().length;
        console.table(blocks.map((b, i) => ({ block: b.name, input: b.inputSrc.slice(0, 50), cold: r1(cold[i]), warm: r1(warm[i]) })));
        const sum = (a) => Math.round(a.reduce((n, x) => n + x, 0));
        new obsidian.Notice(`Vault Views benchmark (${files} notes in vault): ${blocks.length} blocks, cold ${sum(cold)} ms, warm ${sum(warm)} ms. Each block timed alone; details in the console.`, 12000);
    }

    /* ---------- stress test: dummy notes in three "_Stress Test" folders, removed by the delete command */
    stressFolders() {
        const cfg = this.app.metadataCache.getFileCache(this.app.vault.getAbstractFileByPath("98 - Meta/System/Travel/_config.md") ?? {})?.frontmatter ?? {};
        return {
            filler: "_Stress Test",
            places: `${cfg["Places Folder"] ?? "05 - Areas/Travel/Places"}/_Stress Test`,
            itinerary: `${cfg["Trips Folder"] ?? "05 - Areas/Travel/Trips"}/Christmas 2026/_Stress Test`,
        };
    }

    async stressCreate(total) {
        const F = this.stressFolders();
        if (this.app.vault.getAbstractFileByPath(F.filler)) { new obsidian.Notice("Stress test notes already exist; delete them first."); return; }
        const nItin = Math.min(200, Math.round(total * 0.05));
        const nPlaces = Math.round(total * 0.2);
        const nFiller = total - nItin - nPlaces;
        const cities = [["Tokyo, Japan", "Japan", 35.68, 139.76], ["Kyoto, Japan", "Japan", 35.01, 135.77], ["Canberra, Australia", "Australia", -35.28, 149.13]];
        const groups = [["Food", "restaurant"], ["Sights", "tourist_attraction"], ["Nature", "park"], ["Shopping", "store"], ["Stay", "lodging"]];
        const pick = (a) => a[Math.floor(Math.random() * a.length)];
        const jitter = (x) => (x + (Math.random() - 0.5) * 0.2).toFixed(4);
        const words = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(" ");
        const para = () => Array.from({ length: 40 }, () => pick(words)).join(" ") + ".";
        const files = [];
        for (let i = 1; i <= nFiller; i++) {
            const links = Array.from({ length: 5 }, () => `[[Stress Note ${1 + Math.floor(Math.random() * nFiller)}]]`).join(" ");
            const travel = Math.random() < 0.02 ? " Mentions [[Japan]] and [[Tokyo, Japan]]." : "";
            files.push([`${F.filler}/Stress Note ${i}.md`, `---\nType: Note\nCreated: 2026-0${1 + (i % 9)}-1${i % 9}\ntags: [stress, ${pick(["journal", "finance", "media", "ttrpg"])}]\n---\n${para()}\n\n${para()}\n\nSee ${links}.${travel}\n\n- [ ] ${pick(words)} task\n- [x] ${pick(words)} done\n`]);
        }
        for (let i = 1; i <= nPlaces; i++) {
            const [city, country, lat, lon] = pick(cities); const [group, type] = pick(groups);
            files.push([`${F.places}/Stress Place ${i}.md`, `---\nType: Place\nLocale: "[[${city}]]"\nCountry: "[[${country}]]"\nVisited: ${Math.random() < 0.3}\nPrimary Type: ${type}\nGroup: ${group}\nRating: ${(3 + Math.random() * 2).toFixed(1)}\nlocation: "${jitter(lat)},${jitter(lon)}"\n---\n\`\`\`view\nnav\n\`\`\`\n${para()}\n`]);
        }
        for (let i = 1; i <= nItin; i++) {
            const [city, country] = pick(cities.slice(0, 2)); const day = 17 + (i % 14);
            const date = day <= 31 ? `2026-12-${day}` : `2027-01-0${day - 31}`;
            files.push([`${F.itinerary}/Stress Item ${i}.md`, `---\nType: "Itinerary"\nSubtype: "${pick(["Activity", "Food", "Activity"])}"\nTrip: "[[Christmas 2026]]"\nPlace: "[[Stress Place ${1 + Math.floor(Math.random() * Math.max(1, nPlaces))}]]"\nLocale: "[[${city}]]"\nCountry: "[[${country}]]"\nStart: ${date}\n---\n\`\`\`view\nnav\n\`\`\`\n`]);
        }
        for (const f of Object.values(F)) if (!this.app.vault.getAbstractFileByPath(f)) await this.app.vault.createFolder(f);
        const note = new obsidian.Notice(`Creating ${files.length} dummy notes…`, 0);
        const t0 = performance.now();
        for (let i = 0; i < files.length; i += 100) {
            await Promise.all(files.slice(i, i + 100).map(([p, c]) => this.app.vault.create(p, c)));
            note.setMessage(`Creating dummy notes… ${Math.min(i + 100, files.length)} / ${files.length}`);
        }
        note.hide();
        new obsidian.Notice(`Created ${nFiller} filler notes, ${nPlaces} places and ${nItin} Christmas 2026 itinerary items in ${Math.round((performance.now() - t0) / 1000)} s. Give Obsidian a moment to index them before benchmarking.`, 12000);
    }

    async stressDelete() {
        const F = this.stressFolders();
        const folders = Object.values(F).map((p) => this.app.vault.getAbstractFileByPath(p)).filter(Boolean);
        if (!folders.length) { new obsidian.Notice("No stress test notes to delete."); return; }
        const note = new obsidian.Notice("Deleting dummy notes…", 0);
        for (const f of folders) await this.app.vault.delete(f, true);   // permanent, so 5000 files don't land in .trash
        note.hide();
        new obsidian.Notice("Stress test notes deleted.", 6000);
    }

    /* ---------- index */
    page(file) {
        if (!file || file.extension !== "md") return undefined;
        let p = this.pages.get(file.path);
        if (p) return p;
        const fm = this.app.metadataCache.getFileCache(file)?.frontmatter ?? {};
        const link = { path: file.path, display: file.basename, toString() { return `[[${file.path}|${file.basename}]]`; } };
        p = { ...fm, file: { path: file.path, name: file.basename, folder: file.parent?.path ?? "", link, ext: file.extension, ctime: file.stat.ctime, mtime: file.stat.mtime } };
        delete p.position;
        this.pages.set(file.path, p);
        return p;
    }
    resolve(x, from = "") {
        if (x === null || x === undefined || x === "") return null;
        if (x.file?.path) return this.app.vault.getAbstractFileByPath(x.file.path);
        let s = typeof x === "string" ? x : x.path;
        if (!s) return null;
        s = String(s).trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0];
        return this.app.vault.getAbstractFileByPath(s) ?? this.app.vault.getAbstractFileByPath(s + ".md")
            ?? this.app.metadataCache.getFirstLinkpathDest(s, from);
    }
    pagesFrom(source, from) {
        if (!source) {
            if (!this.allPages) this.allPages = this.app.vault.getMarkdownFiles();
            return new DataArray(this.allPages.map((f) => this.page(f)));
        }
        const s = String(source).trim();
        if (/^\[\[.*\]\]$/.test(s)) {                                // notes linking to a note
            const target = this.resolve(s, from);
            if (!target) return new DataArray([]);
            if (!this.backlinks) {
                this.backlinks = new Map();
                for (const [src, targets] of Object.entries(this.app.metadataCache.resolvedLinks))
                    for (const t of Object.keys(targets)) { if (!this.backlinks.has(t)) this.backlinks.set(t, new Set()); this.backlinks.get(t).add(src); }
            }
            return new DataArray([...(this.backlinks.get(target.path) ?? [])].map((p) => this.page(this.app.vault.getAbstractFileByPath(p))).filter(Boolean));
        }
        const folder = this.app.vault.getAbstractFileByPath(s.replace(/^"|"$/g, ""));   // a folder (recursive)
        if (!folder?.children) return new DataArray([]);
        const out = [];
        const walk = (f) => { for (const c of f.children) { if (c.children) walk(c); else if (c.extension === "md") out.push(this.page(c)); } };
        walk(folder);
        return new DataArray(out);
    }
    async tasks(pages) {
        const list = [];
        for (const pg of [].concat(pages instanceof DataArray ? pages.values : pages)) {
            const file = this.resolve(pg); if (!file) continue;
            const items = (this.app.metadataCache.getFileCache(file)?.listItems ?? []).filter((l) => l.task !== undefined);
            if (!items.length) continue;
            const lines = (await this.app.vault.cachedRead(file)).split("\n");
            for (const it of items) {
                const n = it.position.start.line;
                list.push({ text: (lines[n] ?? "").replace(/^\s*[-*+]\s+\[.\]\s*/, ""), completed: it.task !== " ", status: it.task, path: file.path, line: n });
            }
        }
        return list;
    }
    async toggleTask(t, done) {
        const file = this.app.vault.getAbstractFileByPath(t.path);
        if (!file) return;
        await this.app.vault.process(file, (s) => {
            const lines = s.split("\n");
            lines[t.line] = lines[t.line].replace(/\[(.)\]/, done ? "[x]" : "[ ]");
            return lines.join("\n");
        });
    }

    /* ---------- scripts */
    async script(name) {
        const path = name.startsWith(VIEWS_ROOT + "/") ? (name.endsWith(".js") ? name : name + ".js") : `${VIEWS_ROOT}/${name}.js`;
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!file) throw new Error(`no script ${path}`);
        const c = this.compiled.get(path);
        if (c && c.mtime === file.stat.mtime) return c.fn;
        const src = await this.app.vault.cachedRead(file);
        const fn = new Function("dv", "input", "app", `return (async () => {\n${src}\n})();\n//# sourceURL=${path}`);
        this.compiled.set(path, { mtime: file.stat.mtime, fn });
        return fn;
    }

    /** The `dv` object a script receives. Methods use `this`, so Object.create(dv) + a new container works. */
    api(sourcePath, container) {
        const plugin = this;
        const wire = (root) => {
            root.querySelectorAll("a.internal-link").forEach((a) => {
                const target = a.getAttribute("data-href");
                a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); plugin.app.workspace.openLinkText(target, sourcePath, e.ctrlKey || e.metaKey ? "tab" : false); });
                a.addEventListener("mouseover", (e) => plugin.app.workspace.trigger("hover-link", { event: e, source: "preview", hoverParent: root, targetEl: a, linktext: target, sourcePath }));
            });
            return root;
        };
        return {
            container,
            revision: plugin.revision,
            current() { return plugin.page(plugin.app.vault.getAbstractFileByPath(sourcePath)); },
            page(x) { return plugin.page(plugin.resolve(x, sourcePath)); },
            pages(source) { return plugin.pagesFrom(source, sourcePath); },
            date(x) { return DT.of(x); },
            array(a) { return new DataArray(a instanceof DataArray ? a.values : [].concat(a ?? [])); },
            tasks(pages) { return plugin.tasks(pages); },
            toggleTask(t, done) { return plugin.toggleTask(t, done); },
            el(tag, text, opts = {}) {
                const { cls, attr } = opts; const container = opts.container ?? this.container;
                const n = container.createEl(tag, { cls, attr });
                if (text !== undefined && text !== null && text !== "") n.innerHTML = toHtml(text);
                return wire(n);
            },
            paragraph(text, opts = {}) { return this.el("p", text, opts); },
            span(text, opts = {}) { return this.el("span", text, opts); },
            async view(name, input) { const fn = await plugin.script(name); return fn(this, input, plugin.app); },
        };
    }
};

class CountModal extends obsidian.Modal {
    constructor(app, initial, onSubmit) { super(app); this.value = String(initial); this.onSubmit = onSubmit; }
    onOpen() {
        this.titleEl.setText("Create Dummy Notes");
        this.contentEl.createEl("p", { text: "About 75% become filler notes in a root \"_Stress Test\" folder, 20% places in Tokyo, Kyoto and Canberra, and up to 200 itinerary items on Christmas 2026. Delete them with \"Stress test: delete dummy notes\"." });
        new obsidian.Setting(this.contentEl).setName("How many notes").addText((t) => t.setValue(this.value).onChange((v) => (this.value = v)));
        new obsidian.Setting(this.contentEl).addButton((b) => b.setButtonText("Create").setCta().onClick(() => {
            const n = parseInt(this.value, 10);
            if (!(n > 0 && n <= 50000)) { new obsidian.Notice("Enter a number between 1 and 50000"); return; }
            this.close(); this.onSubmit(n);
        }));
    }
    onClose() { this.contentEl.empty(); }
}

class ViewBlock extends obsidian.MarkdownRenderChild {
    constructor(plugin, source, el, sourcePath) {
        super(el);
        this.plugin = plugin; this.source = source; this.sourcePath = sourcePath;
        const text = source.trim();
        const sp = text.search(/\s/);
        this.name = sp < 0 ? text : text.slice(0, sp);
        this.inputSrc = sp < 0 ? "" : text.slice(sp).trim();
    }
    onload() { this.plugin.mounted.add(this); this.render(); }
    onunload() { this.plugin.mounted.delete(this); }
    async render() {
        const t0 = performance.now();
        const el = this.containerEl;
        const fresh = el.createDiv({ cls: "vault-view" });   // build off to the side, then swap: no flicker
        fresh.style.display = "contents";
        try {
            const input = this.inputSrc ? new Function(`return (${this.inputSrc});`)() : undefined;
            const fn = await this.plugin.script(this.name);
            await fn(this.plugin.api(this.sourcePath, fresh), input, this.plugin.app);
        } catch (e) {
            console.error(`Vault Views: ${this.name} in ${this.sourcePath}`, e);
            fresh.empty(); fresh.createEl("pre", { cls: "vault-view-error", text: `${this.name}: ${e.message}` });
        }
        for (const c of [...el.children]) if (c !== fresh) c.remove();
        this.plugin.timings.set(`${this.sourcePath.split("/").pop()} · ${this.name}`, performance.now() - t0);
    }
}
