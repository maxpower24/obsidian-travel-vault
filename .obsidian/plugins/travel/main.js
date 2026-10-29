/* Travel 0.1.0 — built from obsidian-vault-plugins; edit the source, not this file */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// plugins/travel/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => Travel
});
module.exports = __toCommonJS(main_exports);
var import_obsidian14 = require("obsidian");

// packages/shared/src/engine.ts
var import_obsidian = require("obsidian");

// packages/shared/src/vaultIndex.ts
var Deps = class {
  constructor(sink) {
    this.sink = sink;
  }
  sink;
  alive = true;
  add(token) {
    if (this.alive) this.sink(token);
  }
};
var folderOf = (path) => path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
var ancestors = (path) => {
  const out = [];
  for (let f = folderOf(path); ; f = folderOf(f)) {
    out.push(f);
    if (!f) break;
  }
  return out;
};
var basenameOf = (path) => path.split("/").pop().replace(/\.md$/, "");
var cleanLink = (v) => {
  const s = typeof v === "string" ? v : v?.path ?? "";
  return String(s).trim().replace(/^!?\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
};
var VaultIndex = class {
  constructor(app) {
    this.app = app;
  }
  app;
  fmSnap = /* @__PURE__ */ new Map();
  outLinks = /* @__PURE__ */ new Map();
  back = null;
  listeners = [];
  onInvalidate(fn) {
    this.listeners.push(fn);
  }
  emit(tokens) {
    if (tokens.size) for (const l of this.listeners) l(tokens);
  }
  /** Start listening. Call from onLayoutReady: Obsidian fires "create" for every file while loading. */
  watch(owner) {
    const mc = this.app.metadataCache, vault = this.app.vault;
    owner.registerEvent(mc.on("changed", (file, _d, cache) => this.changed(file, cache)));
    owner.registerEvent(vault.on("create", (f) => this.created(f)));
    owner.registerEvent(vault.on("delete", (f) => this.deleted(f.path)));
    owner.registerEvent(vault.on("rename", (f, old) => {
      this.deleted(old);
      this.created(f);
    }));
  }
  snapshot(cache) {
    const fm = { ...cache?.frontmatter ?? {} };
    delete fm.position;
    return fm;
  }
  resolvedOut(path, cache) {
    const out = /* @__PURE__ */ new Set();
    for (const l of [...cache?.links ?? [], ...cache?.frontmatterLinks ?? []]) {
      const t = this.app.metadataCache.getFirstLinkpathDest(l.link.split("#")[0], path);
      if (t) out.add(t.path);
    }
    return out;
  }
  knownOut(path) {
    let s = this.outLinks.get(path);
    if (!s) {
      s = new Set(Object.keys(this.app.metadataCache.resolvedLinks[path] ?? {}));
      this.outLinks.set(path, s);
    }
    return s;
  }
  changed(file, cache) {
    const p = file.path, tokens = /* @__PURE__ */ new Set([`x:${p}`]);
    const before = this.fmSnap.get(p) ?? {};
    const after = this.snapshot(cache);
    const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
    let keySetChanged = Object.keys(before).length !== Object.keys(after).length;
    for (const k of keys) {
      if (!(k in before) || !(k in after)) keySetChanged = true;
      if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) tokens.add(`k:${p}:${k}`);
    }
    if (keySetChanged) tokens.add(`f:${p}`);
    this.fmSnap.set(p, after);
    const oldOut = this.knownOut(p), newOut = this.resolvedOut(p, cache);
    for (const t of /* @__PURE__ */ new Set([...oldOut, ...newOut])) if (oldOut.has(t) !== newOut.has(t)) {
      tokens.add(`b:${t}`);
      this.back = null;
    }
    this.outLinks.set(p, newOut);
    this.emit(tokens);
  }
  created(f) {
    const tokens = /* @__PURE__ */ new Set([`f:${f.path}`, `n:${basenameOf(f.path).toLowerCase()}`]);
    for (const a of ancestors(f.path)) tokens.add(`d:${a}`);
    this.back = null;
    this.emit(tokens);
  }
  deleted(path) {
    const tokens = /* @__PURE__ */ new Set([`f:${path}`, `x:${path}`, `b:${path}`]);
    for (const a of ancestors(path)) tokens.add(`d:${a}`);
    for (const t of this.outLinks.get(path) ?? []) tokens.add(`b:${t}`);
    this.fmSnap.delete(path);
    this.outLinks.delete(path);
    this.back = null;
    this.emit(tokens);
  }
  /** A view of the vault that records what it reads into `deps`. */
  scope(deps) {
    return new VaultView(this, deps);
  }
  // ---- shared, unrecorded helpers (used by VaultView)
  fileAt(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    return f && f.extension ? f : null;
  }
  rawFm(file) {
    let s = this.fmSnap.get(file.path);
    if (!s) {
      s = this.snapshot(this.app.metadataCache.getFileCache(file));
      this.fmSnap.set(file.path, s);
    }
    return s;
  }
  backlinkPaths(path) {
    if (!this.back) {
      this.back = /* @__PURE__ */ new Map();
      for (const [src, targets] of Object.entries(this.app.metadataCache.resolvedLinks))
        for (const t of Object.keys(targets)) {
          let s = this.back.get(t);
          if (!s) this.back.set(t, s = /* @__PURE__ */ new Set());
          s.add(src);
        }
    }
    return this.back.get(path) ?? /* @__PURE__ */ new Set();
  }
  linkName = cleanLink;
};
var VaultView = class {
  constructor(index, deps) {
    this.index = index;
    this.deps = deps;
  }
  index;
  deps;
  get app() {
    return this.index.app;
  }
  file(path) {
    this.deps.add(`f:${path}`);
    return this.index.fileAt(path);
  }
  /** Frontmatter of a note, as a read-only record. Reading a key depends on that key only. */
  fm(file) {
    const f = typeof file === "string" ? this.file(file) : file;
    if (!f) return {};
    const raw = this.index.rawFm(f), deps = this.deps, p = f.path;
    return new Proxy(raw, {
      get: (t, k) => {
        if (typeof k === "string") deps.add(`k:${p}:${k}`);
        return t[k];
      },
      has: (t, k) => {
        if (typeof k === "string") deps.add(`k:${p}:${k}`);
        return k in t;
      },
      ownKeys: (t) => {
        deps.add(`f:${p}`);
        return Reflect.ownKeys(t);
      },
      getOwnPropertyDescriptor: (t, k) => Reflect.getOwnPropertyDescriptor(t, k),
      set: () => false
    });
  }
  /** Resolve a link value ("[[X]]", "X", "X|alias", a path) from `from`. */
  resolve(value, from = "") {
    const name = this.index.linkName(value);
    if (!name) return null;
    const f = this.index.fileAt(name) ?? this.index.fileAt(name + ".md") ?? this.app.metadataCache.getFirstLinkpathDest(name, from);
    if (f) this.deps.add(`f:${f.path}`);
    else this.deps.add(`n:${name.split("/").pop().toLowerCase()}`);
    return f;
  }
  /** Notes that link to `path` (frontmatter links count). */
  backlinks(path) {
    this.deps.add(`b:${path}`);
    return [...this.index.backlinkPaths(path)].map((p) => this.index.fileAt(p)).filter((f) => !!f && f.extension === "md");
  }
  /** Markdown notes in a folder and its subfolders. */
  inFolder(folder) {
    this.deps.add(`d:${folder}`);
    const root = this.app.vault.getAbstractFileByPath(folder);
    const out = [];
    const walk = (f) => {
      for (const c of f.children) {
        if (c.children) walk(c);
        else if (c.extension === "md") out.push(c);
      }
    };
    if (root && root.children) walk(root);
    return out;
  }
  /** Every file (any type) in a folder and its subfolders. */
  filesIn(folder) {
    this.deps.add(`d:${folder}`);
    const root = this.app.vault.getAbstractFileByPath(folder);
    const out = [];
    const walk = (f) => {
      for (const c of f.children) {
        if (c.children) walk(c);
        else out.push(c);
      }
    };
    if (root && root.children) walk(root);
    return out;
  }
  /** Checkbox items in a note. */
  async tasks(file) {
    this.deps.add(`x:${file.path}`);
    const items = (this.app.metadataCache.getFileCache(file)?.listItems ?? []).filter((l) => l.task !== void 0);
    if (!items.length) return [];
    const lines = (await this.app.vault.cachedRead(file)).split("\n");
    return items.map((it) => {
      const n = it.position.start.line;
      return { text: (lines[n] ?? "").replace(/^\s*[-*+]\s+\[.\]\s*/, ""), done: it.task !== " ", status: it.task, path: file.path, line: n };
    });
  }
  /** Today's key; the block redraws at midnight. */
  today() {
    this.deps.add("clock:day");
    const d = /* @__PURE__ */ new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
};
async function setTask(app, t, done) {
  const file = app.vault.getAbstractFileByPath(t.path);
  if (!file) return;
  await app.vault.process(file, (s) => {
    const lines = s.split("\n");
    lines[t.line] = lines[t.line].replace(/\[(.)\]/, done ? "[x]" : "[ ]");
    return lines.join("\n");
  });
}

// packages/shared/src/text.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var TAGS = /(<br\s*\/?>|<\/?small>|<\/?strong>|<\/span>|<\/div>|<span (?:class|style)="[^"<>]*">|<div (?:class|style)="[^"<>]*">)/g;
var inline = (s) => esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, p, t) => `<a class="internal-link" data-href="${p}" href="${p}">${t ?? p.split("/").pop().replace(/\.md$/, "")}</a>`).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="external-link" href="$2" target="_blank" rel="noopener">$1</a>');
var toHtml = (text) => String(text ?? "").split(TAGS).map((part, i) => i % 2 ? part : inline(part)).join("");
function wireLinks(app, root, sourcePath) {
  root.querySelectorAll("a.internal-link").forEach((a) => {
    const target = a.getAttribute("data-href") ?? "";
    a.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void app.workspace.openLinkText(target, sourcePath, e.ctrlKey || e.metaKey ? "tab" : false);
    });
    a.addEventListener("mouseover", (e) => app.workspace.trigger("hover-link", {
      event: e,
      source: "preview",
      hoverParent: root,
      targetEl: a,
      linktext: target,
      sourcePath
    }));
  });
  return root;
}
function textWriter(app, sourcePath) {
  const make = (tag) => (el, text) => {
    const n = el.createEl(tag);
    n.innerHTML = toHtml(text);
    return wireLinks(app, n, sourcePath);
  };
  return { p: make("p"), span: make("span"), div: make("div") };
}
var linkTo = (path, label) => `[[${path}|${label ?? path.split("/").pop().replace(/\.md$/, "")}]]`;

// packages/shared/src/engine.ts
var BOX = '.callout[data-callout-metadata~="box"]';
var BlockEngine = class {
  constructor(plugin, index, opts) {
    this.plugin = plugin;
    this.index = index;
    this.opts = opts;
  }
  plugin;
  index;
  opts;
  mounted = /* @__PURE__ */ new Set();
  timings = /* @__PURE__ */ new Map();
  subs = /* @__PURE__ */ new Map();
  memos = /* @__PURE__ */ new Map();
  pending = /* @__PURE__ */ new Set();
  timer = null;
  get app() {
    return this.plugin.app;
  }
  /** Register the code block processor and start listening. Call from the plugin's onload. */
  start() {
    this.plugin.registerMarkdownCodeBlockProcessor(this.opts.language, (source, el, ctx) => {
      ctx.addChild(new ViewBlock(this, source, el, ctx.sourcePath));
    });
    this.index.onInvalidate((tokens) => this.invalidate(tokens));
    this.armMidnight();
  }
  // ---- subscriptions
  subscribe(token, owner) {
    let s = this.subs.get(token);
    if (!s) this.subs.set(token, s = /* @__PURE__ */ new Set());
    s.add(owner);
    owner.tokens.add(token);
  }
  unsubscribe(owner) {
    for (const t of owner.tokens) this.subs.get(t)?.delete(owner);
    owner.tokens.clear();
  }
  invalidate(tokens) {
    const queue = [...tokens];
    while (queue.length) {
      const t = queue.pop();
      for (const o of [...this.subs.get(t) ?? []]) {
        if (o.kind === "memo") {
          if (this.memos.get(o.key) !== o) continue;
          this.memos.delete(o.key);
          o.deps.alive = false;
          this.unsubscribe(o);
          queue.push(`m:${o.key}`);
        } else this.pending.add(o);
      }
    }
    if (this.pending.size && this.timer === null) {
      this.timer = window.setTimeout(() => {
        this.timer = null;
        const blocks = [...this.pending];
        this.pending.clear();
        for (const b of blocks) if (this.mounted.has(b)) void b.render();
      }, this.opts.delay ?? 300);
    }
  }
  memo(deps, key, compute) {
    deps.add(`m:${key}`);
    const hit = this.memos.get(key);
    if (hit) return hit.value;
    const entry = { kind: "memo", key, value: void 0, deps: null, tokens: /* @__PURE__ */ new Set() };
    entry.deps = new Deps((t) => this.subscribe(t, entry));
    this.memos.set(key, entry);
    try {
      entry.value = compute(this.index.scope(entry.deps));
    } catch (e) {
      this.memos.delete(key);
      entry.deps.alive = false;
      this.unsubscribe(entry);
      throw e;
    }
    return entry.value;
  }
  /** Forget every cached computation and redraw every block. */
  refreshAll() {
    for (const m of this.memos.values()) {
      m.deps.alive = false;
      this.unsubscribe(m);
    }
    this.memos.clear();
    for (const b of this.mounted) void b.render();
  }
  armMidnight() {
    const now = /* @__PURE__ */ new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const id = window.setTimeout(() => {
      this.invalidate(["clock:day"]);
      this.armMidnight();
    }, next.getTime() - now.getTime());
    this.plugin.register(() => window.clearTimeout(id));
  }
  /** Re-render each block of a note one at a time: cold (caches dropped) then warm. */
  async benchmark(path) {
    const blocks = [...this.mounted].filter((b) => b.sourcePath === path);
    const pass = async () => {
      const out = [];
      for (const b of blocks) {
        const t0 = performance.now();
        await b.render();
        out.push(performance.now() - t0);
      }
      return out;
    };
    for (const m of this.memos.values()) {
      m.deps.alive = false;
      this.unsubscribe(m);
    }
    this.memos.clear();
    const cold = await pass(), warm = await pass();
    return blocks.map((b, i) => ({ block: `${this.opts.language} \xB7 ${b.name}`, cold: cold[i], warm: warm[i] }));
  }
};
var ViewBlock = class extends import_obsidian.MarkdownRenderChild {
  constructor(engine, source, el, sourcePath) {
    super(el);
    this.engine = engine;
    this.sourcePath = sourcePath;
    const lines = source.replace(/\r/g, "").split("\n");
    const first = (lines[0] ?? "").trim();
    if (engine.opts.defaultWidget && (!first || first.includes(":"))) {
      this.name = engine.opts.defaultWidget;
      this.yaml = source;
    } else {
      this.name = first;
      this.yaml = lines.slice(1).join("\n");
    }
  }
  engine;
  sourcePath;
  kind = "block";
  tokens = /* @__PURE__ */ new Set();
  name;
  yaml;
  gen = 0;
  deps = null;
  cleanups = [];
  hiddenEl = null;
  onload() {
    this.engine.mounted.add(this);
    void this.render();
  }
  onunload() {
    this.engine.mounted.delete(this);
    this.reset();
    this.setHidden(false);
  }
  reset() {
    if (this.deps) this.deps.alive = false;
    this.engine.unsubscribe(this);
    for (const fn of this.cleanups.splice(0)) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
  }
  async render() {
    const t0 = performance.now();
    const gen = ++this.gen;
    this.reset();
    const deps = this.deps = new Deps((t) => this.engine.subscribe(t, this));
    const el = this.containerEl;
    const fresh = el.createDiv({ cls: `${this.engine.opts.language}-view` });
    fresh.style.display = "contents";
    let hide = false;
    const engine = this.engine, app = engine.app;
    const base = {
      app,
      el: fresh,
      input: {},
      sourcePath: this.sourcePath,
      vault: engine.index.scope(deps),
      t: textWriter(app, this.sourcePath),
      hide: () => {
        hide = true;
        if (gen === this.gen) this.setHidden(true);
      },
      memo: (key, compute) => engine.memo(deps, key, compute),
      current: () => gen === this.gen && this.engine.mounted.has(this),
      onCleanup: (fn) => this.cleanups.push(fn)
    };
    try {
      const widget = engine.opts.widgets[this.name];
      if (!widget) throw new Error(`No widget called "${this.name}". Available: ${Object.keys(engine.opts.widgets).sort().join(", ")}`);
      if (this.yaml.trim()) {
        const parsed = (0, import_obsidian.parseYaml)(this.yaml);
        if (parsed !== null && (typeof parsed !== "object" || Array.isArray(parsed))) throw new Error("Options below the widget name must be `key: value` lines");
        base.input = parsed ?? {};
      }
      await widget(engine.opts.extend(base));
    } catch (e) {
      console.error(`${engine.opts.language} \xB7 ${this.name} in ${this.sourcePath}`, e);
      fresh.empty();
      fresh.createEl("pre", { cls: "vault-block-error", text: `${this.name || "(no widget name)"}: ${e.message}` });
      hide = false;
    }
    if (gen !== this.gen) {
      fresh.remove();
      return;
    }
    for (const c of [...Array.from(el.children)]) if (c !== fresh) c.remove();
    this.setHidden(hide);
    engine.timings.set(`${this.sourcePath.split("/").pop()} \xB7 ${engine.opts.language} ${this.name}`, performance.now() - t0);
  }
  /** Hide/show the surrounding box; waits for the block to be attached if it isn't yet. */
  setHidden(on, tries = 0) {
    const el = this.containerEl;
    if (!on) {
      this.hiddenEl?.removeClass("vault-hidden");
      this.hiddenEl = null;
      return;
    }
    if (!el.isConnected) {
      if (tries < 20) window.requestAnimationFrame(() => {
        if (this.engine.mounted.has(this)) this.setHidden(true, tries + 1);
      });
      return;
    }
    const target = el.closest(BOX) ?? el;
    if (this.hiddenEl && this.hiddenEl !== target) this.hiddenEl.removeClass("vault-hidden");
    target.addClass("vault-hidden");
    this.hiddenEl = target;
  }
};

// packages/shared/src/core.ts
var CORE_ID = "vault-core";
function getCore(app) {
  return app.plugins?.getPlugin(CORE_ID)?.api ?? null;
}
var folderLabel = (path) => path.split("/").pop().replace(/\.md$/, "").replace(/^\d+\s*-\s*/, "");
var folderNote = (folder) => `${folder}/${folder.split("/").pop()}.md`;

// plugins/travel/src/settings.ts
var import_obsidian2 = require("obsidian");

// plugins/travel/src/icons.ts
var DEFAULT_ICONS = {
  types: {
    bar: "\u{1F37A}",
    pub: "\u{1F37A}",
    wine_bar: "\u{1F377}",
    night_club: "\u{1FAA9}",
    brewery: "\u{1F37A}",
    cafe: "\u2615",
    coffee_shop: "\u2615",
    tea_house: "\u{1F375}",
    bakery: "\u{1F950}",
    dessert_shop: "\u{1F370}",
    ice_cream_shop: "\u{1F366}",
    restaurant: "\u{1F37D}\uFE0F",
    ramen_restaurant: "\u{1F35C}",
    japanese_restaurant: "\u{1F371}",
    sushi_restaurant: "\u{1F363}",
    pizza_restaurant: "\u{1F355}",
    hamburger_restaurant: "\u{1F354}",
    fast_food_restaurant: "\u{1F354}",
    seafood_restaurant: "\u{1F990}",
    steak_house: "\u{1F969}",
    barbecue_restaurant: "\u{1F356}",
    chinese_restaurant: "\u{1F95F}",
    korean_restaurant: "\u{1F372}",
    thai_restaurant: "\u{1F35B}",
    indian_restaurant: "\u{1F35B}",
    vietnamese_restaurant: "\u{1F35C}",
    italian_restaurant: "\u{1F35D}",
    mexican_restaurant: "\u{1F32E}",
    vegetarian_restaurant: "\u{1F957}",
    vegan_restaurant: "\u{1F957}",
    breakfast_restaurant: "\u{1F373}",
    brunch_restaurant: "\u{1F373}",
    market: "\u{1F6CD}\uFE0F",
    food_court: "\u{1F37D}\uFE0F",
    shopping_mall: "\u{1F6CD}\uFE0F",
    store: "\u{1F6CD}\uFE0F",
    book_store: "\u{1F4DA}",
    department_store: "\u{1F6CD}\uFE0F",
    hotel: "\u{1F6CF}\uFE0F",
    lodging: "\u{1F6CF}\uFE0F",
    hostel: "\u{1F6CF}\uFE0F",
    resort_hotel: "\u{1F3E8}",
    bed_and_breakfast: "\u{1F6CF}\uFE0F",
    guest_house: "\u{1F6CF}\uFE0F",
    campground: "\u{1F3D5}\uFE0F",
    park: "\u{1F333}",
    national_park: "\u{1F3DE}\uFE0F",
    garden: "\u{1F337}",
    botanical_garden: "\u{1F337}",
    hiking_area: "\u{1F97E}",
    beach: "\u{1F3D6}\uFE0F",
    zoo: "\u{1F981}",
    aquarium: "\u{1F420}",
    museum: "\u{1F3DB}\uFE0F",
    art_gallery: "\u{1F5BC}\uFE0F",
    historical_landmark: "\u{1F3EF}",
    monument: "\u{1F5FF}",
    castle: "\u{1F3EF}",
    tourist_attraction: "\u{1F4F8}",
    observation_deck: "\u{1F306}",
    buddhist_temple: "\u26E9\uFE0F",
    shinto_shrine: "\u26E9\uFE0F",
    hindu_temple: "\u{1F6D5}",
    church: "\u26EA",
    mosque: "\u{1F54C}",
    synagogue: "\u{1F54D}",
    place_of_worship: "\u{1F64F}",
    amusement_park: "\u{1F3A2}",
    stadium: "\u{1F3DF}\uFE0F",
    performing_arts_theater: "\u{1F3AD}",
    movie_theater: "\u{1F3AC}",
    concert_hall: "\u{1F3B5}",
    spa: "\u2668\uFE0F",
    public_bath: "\u2668\uFE0F",
    train_station: "\u{1F686}",
    subway_station: "\u{1F687}",
    bus_station: "\u{1F68C}",
    airport: "\u2708\uFE0F",
    ferry_terminal: "\u26F4\uFE0F"
  },
  groups: { Food: "\u{1F37D}\uFE0F", Cafe: "\u2615", Bar: "\u{1F37A}", Pub: "\u{1F37A}", Stay: "\u{1F6CF}\uFE0F", Sight: "\u{1F4CD}", Transport: "\u{1F686}" },
  subtypes: { Stay: "\u{1F6CF}\uFE0F", Meal: "\u{1F37D}\uFE0F", Activity: "\u{1F4CD}", Transport: "\u{1F686}" },
  modes: { Flight: "\u2708\uFE0F", Train: "\u{1F684}", Bus: "\u{1F68C}", Ferry: "\u26F4\uFE0F", Cruise: "\u{1F6F3}\uFE0F", Car: "\u{1F697}" },
  default: "\u{1F4CD}"
};

// plugins/travel/src/settings.ts
var DEFAULT_SETTINGS = {
  moduleRoot: "05 - Areas/Travel",
  countriesFolder: "05 - Areas/Travel/Countries",
  localesFolder: "05 - Areas/Travel/Cities & Regions",
  placesFolder: "05 - Areas/Travel/Places",
  tripsFolder: "05 - Areas/Travel/Trips",
  placesInbox: "06 - Resources/Google Places",
  countryImagesFolder: "06 - Resources/Images/Countries",
  localeImagesFolder: "06 - Resources/Images/Cities & Regions",
  tripImagesFolder: "06 - Resources/Images/Trips",
  tripDocumentsFolder: "06 - Resources/Documents/Trips",
  flagsFolder: "06 - Resources/Images/Icons/Flags",
  basesFolder: "98 - Meta/Databases/Travel",
  templatesFolder: "98 - Meta/Templates/Travel",
  packingBaseline: "98 - Meta/System/Travel/Packing Baseline.md",
  homeTimezone: "Australia/Melbourne",
  homeCity: "Melbourne",
  homeCurrency: "AUD",
  googleSecret: "google-places",
  restCountriesSecret: "rest-countries",
  mapSourceIndex: 0,
  coverCandidates: 3,
  nearbyRadiusKm: 150,
  holidayCalendars: {},
  icons: DEFAULT_ICONS,
  configImported: false
};
var OLD_CONFIG = "98 - Meta/System/Travel/_config.md";
var CONFIG_KEYS = {
  "Module Root": "moduleRoot",
  "Countries Folder": "countriesFolder",
  "Locales Folder": "localesFolder",
  "Places Folder": "placesFolder",
  "Trips Folder": "tripsFolder",
  "Places Inbox": "placesInbox",
  "Country Images Folder": "countryImagesFolder",
  "Locale Images Folder": "localeImagesFolder",
  "Trip Images Folder": "tripImagesFolder",
  "Trip Documents Folder": "tripDocumentsFolder",
  "Flags Folder": "flagsFolder",
  "Bases Folder": "basesFolder",
  "Packing Baseline": "packingBaseline",
  "Home Timezone": "homeTimezone",
  "Home City": "homeCity",
  "Home Currency": "homeCurrency",
  "Google Secret": "googleSecret",
  "REST Countries Secret": "restCountriesSecret",
  "Map Source Index": "mapSourceIndex",
  "Cover Candidates": "coverCandidates",
  "Nearby Radius km": "nearbyRadiusKm"
};
function importOldConfig(app, s) {
  const file = app.vault.getAbstractFileByPath(OLD_CONFIG);
  const fm = file ? app.metadataCache.getFileCache(file)?.frontmatter : null;
  if (!fm) return 0;
  let n = 0;
  for (const [key, setting] of Object.entries(CONFIG_KEYS)) {
    const v = fm[key];
    if (v === void 0 || v === null || v === "") continue;
    s[setting] = typeof DEFAULT_SETTINGS[setting] === "number" ? Number(v) : String(v);
    n++;
  }
  for (const line of [].concat(fm["Holiday Calendars"] ?? [])) {
    const [cc, id] = String(line).split(":").map((x) => x.trim());
    if (cc && id) {
      s.holidayCalendars[cc.toUpperCase()] = id;
      n++;
    }
  }
  return n;
}
var TravelSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  display() {
    const { containerEl } = this, s = this.plugin.settings;
    containerEl.empty();
    const save = () => void this.plugin.saveSettings();
    const text = (name, key, desc = "") => new import_obsidian2.Setting(containerEl).setName(name).setDesc(desc).addText((t) => t.setValue(String(s[key])).onChange((v) => {
      s[key] = v.trim();
      save();
    }));
    const num = (name, key, desc = "") => new import_obsidian2.Setting(containerEl).setName(name).setDesc(desc).addText((t) => t.setValue(String(s[key])).onChange((v) => {
      const n = Number(v);
      if (Number.isFinite(n)) {
        s[key] = n;
        save();
      }
    }));
    const heading3 = (name) => new import_obsidian2.Setting(containerEl).setName(name).setHeading();
    heading3("Folders");
    text("Module Root", "moduleRoot", "Notes under this folder are Travel notes (nav bar, breadcrumbs).");
    text("Countries Folder", "countriesFolder");
    text("Cities & Regions Folder", "localesFolder");
    text("Places Folder", "placesFolder");
    text("Trips Folder", "tripsFolder", "Each trip is a folder here holding its trip note, itinerary notes and packing list.");
    text("Places Inbox", "placesInbox", `Where Map View creates new place notes (must match Map View's "New note path").`);
    text("Country Images Folder", "countryImagesFolder");
    text("Cities & Regions Images Folder", "localeImagesFolder");
    text("Trip Images Folder", "tripImagesFolder");
    text("Trip Documents Folder", "tripDocumentsFolder", "Bookings, insurance and other files, in <folder>/<Trip>/.");
    text("Flags Folder", "flagsFolder");
    text("Bases Folder", "basesFolder");
    text("Templates Folder", "templatesFolder", "Country, City, Trip, Itinerary and Packing List templates.");
    text("Packing Baseline", "packingBaseline", "Note whose tasks every trip's packing list starts from.");
    heading3("Home");
    text("Home Timezone", "homeTimezone", "IANA name, e.g. Australia/Melbourne.");
    text("Home City", "homeCity");
    text("Home Currency", "homeCurrency", "Exchange rates are shown from this currency.");
    heading3("Services");
    text("Google Secret", "googleSecret", "Keychain secret ID (Settings \u2192 Keychain) for the Google Places API key.");
    text("REST Countries Secret", "restCountriesSecret", "Keychain secret ID for the REST Countries key.");
    num("Map Source Index", "mapSourceIndex", "Position of MapTiler in Map View's map sources (0 = first).");
    new import_obsidian2.Setting(containerEl).setName("Holiday Calendars").setDesc("Google Calendar fallbacks for countries Nager.Date doesn't cover, one per line as CODE: calendar-id (e.g. TH: en.th).").addTextArea((t) => t.setValue(Object.entries(s.holidayCalendars).map(([k, v]) => `${k}: ${v}`).join("\n")).onChange((v) => {
      s.holidayCalendars = {};
      for (const line of v.split("\n")) {
        const [cc, id] = line.split(":").map((x) => x.trim());
        if (cc && id) s.holidayCalendars[cc.toUpperCase()] = id;
      }
      save();
    }));
    heading3("Widgets");
    num("Cover Candidates", "coverCandidates", "Photos offered when choosing a cover.");
    num("Nearby Radius km", "nearbyRadiusKm", "How far Nearby Cities & Regions reaches.");
    new import_obsidian2.Setting(containerEl).setName("Place Icons").setDesc("JSON: types (Google primary type), groups (place Group), subtypes (itinerary Subtype), modes (transport Mode), default.").addTextArea((t) => {
      t.inputEl.rows = 10;
      t.inputEl.addClass("travel-settings-json");
      t.setValue(JSON.stringify(s.icons, null, 1)).onChange((v) => {
        try {
          s.icons = { ...DEFAULT_ICONS, ...JSON.parse(v) };
          save();
          t.inputEl.removeClass("is-invalid");
        } catch {
          t.inputEl.addClass("is-invalid");
        }
      });
    }).addButton((b) => b.setButtonText("Reset").onClick(() => {
      s.icons = DEFAULT_ICONS;
      save();
      this.display();
      new import_obsidian2.Notice("Place icons reset");
    }));
  }
};

// packages/shared/src/dates.ts
var pad = (n) => String(n).padStart(2, "0");
var DAY_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;
function dayKey(v) {
  if (v === null || v === void 0 || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  const m = String(v).match(DAY_RE);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
function timeOf(v) {
  const m = String(v ?? "").match(DAY_RE);
  if (!m || m[4] === void 0) return null;
  const t = `${m[4]}:${m[5]}`;
  return t === "00:00" ? null : t;
}
function stamp(v) {
  const m = String(v ?? "").match(DAY_RE);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0).getTime();
}
var todayKey = (now = /* @__PURE__ */ new Date()) => dayKey(now);
var utc = (k) => {
  const [y, m, d] = k.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
function addDays(k, n) {
  const d = new Date(utc(k) + n * 864e5);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
var daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / 864e5);
function daysFrom(a, b) {
  const out = [];
  for (let k = a; k < b; k = addDays(k, 1)) out.push(k);
  return out;
}
var WD = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var MO = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var MONTHS_SHORT = MO.map((m) => m.slice(0, 3));
function fmt(v, pattern) {
  const m = String(v ?? "").match(DAY_RE);
  if (!m) return "";
  const date = new Date(+m[1], +m[2] - 1, +m[3]);
  const map = {
    cccc: WD[date.getDay()],
    ccc: WD[date.getDay()].slice(0, 3),
    dd: m[3],
    d: String(+m[3]),
    LLLL: MO[+m[2] - 1],
    LLL: MO[+m[2] - 1].slice(0, 3),
    MM: m[2],
    yyyy: m[1],
    HH: m[4] ?? "00",
    mm: m[5] ?? "00"
  };
  return pattern.replace(/cccc|ccc|dd|d|LLLL|LLL|MM|yyyy|HH|mm/g, (t) => map[t]);
}
var plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

// plugins/travel/src/model.ts
var toNote = (vault, file) => ({ file, path: file.path, name: file.basename, folder: file.parent?.path ?? "", fm: vault.fm(file) });
var shortName = (n) => n.replace(/,[^,]*$/, "");
function follow(vault, value, from = "") {
  const f = vault.resolve(value, from);
  return f && f.extension === "md" ? toNote(vault, f) : null;
}
var pointsAt = (vault, value, target, from = "") => !!value && vault.resolve(value, from)?.path === target.path;
function linking(vault, note, type, field) {
  return vault.backlinks(note.path).map((f) => toNote(vault, f)).filter((n) => (!type || n.fm.Type === type) && (!field || pointsAt(vault, n.fm[field], note, n.path)));
}
var fieldFor = (n) => n.fm.Type === "Country" ? "Country" : "Locale";
var trips = (vault, s) => vault.inFolder(s.tripsFolder).map((f) => toNote(vault, f)).filter((n) => n.fm.Type === "Trip");
var itineraryOf = (vault, trip) => vault.inFolder(trip.folder).map((f) => toNote(vault, f)).filter((n) => n.fm.Type === "Itinerary" && pointsAt(vault, n.fm.Trip, trip, n.path));
function tripStatus(trip, today) {
  const start = dayKey(trip.fm.Start), end = dayKey(trip.fm.End);
  if (trip.fm.Cancelled) return "Cancelled";
  if (!start) return "Idea";
  if (end && end < today) return "Done";
  if (start <= today) return "Active";
  return trip.fm.Booked ? "Booked" : "Planning";
}
var byStart = (a, b) => (stamp(a.fm.Start) ?? 0) - (stamp(b.fm.Start) ?? 0) || a.name.localeCompare(b.name);
function activeTrip(vault, s) {
  const today = vault.today();
  return trips(vault, s).filter((t) => !t.fm.Cancelled && dayKey(t.fm.Start) && dayKey(t.fm.Start) <= today && (!dayKey(t.fm.End) || dayKey(t.fm.End) >= today)).sort(byStart)[0] ?? null;
}
function tripData(vault, trip) {
  const today = vault.today();
  const itins = itineraryOf(vault, trip);
  const dated = itins.filter((p) => dayKey(p.fm.Start)).sort(byStart);
  const stays = dated.filter((p) => p.fm.Subtype === "Stay");
  const transport = dated.filter((p) => p.fm.Subtype === "Transport");
  const start = dayKey(trip.fm.Start), end = dayKey(trip.fm.End);
  const phase = trip.fm.Cancelled ? "Cancelled" : !start ? "Idea" : today < start ? "Before" : end && today > end ? "After" : "During";
  const days = start && end ? daysBetween(start, end) + 1 : null;
  const nights = start && end ? daysFrom(start, end) : [];
  const lastNight = (p) => {
    const s = dayKey(p.fm.Start), e = dayKey(p.fm.End);
    return e && e > s ? e : addDays(s, 1);
  };
  const covered = /* @__PURE__ */ new Set();
  for (const p of stays) for (const k of daysFrom(dayKey(p.fm.Start), lastNight(p))) covered.add(k);
  for (const p of transport) {
    const s = dayKey(p.fm.Start), e = dayKey(p.fm.End);
    if (e && e > s) for (const k of daysFrom(s, e)) covered.add(k);
  }
  const gaps2 = [];
  for (const k of nights.filter((n) => !covered.has(n))) {
    const g = gaps2[gaps2.length - 1];
    if (g && addDays(g.to, 1) === k) {
      g.to = k;
      g.count++;
    } else gaps2.push({ from: k, to: k, count: 1 });
  }
  const uniq = (list) => {
    const seen = /* @__PURE__ */ new Set();
    return list.filter((n) => !!n && !seen.has(n.path) && !!seen.add(n.path));
  };
  const ordered = [...dated, ...itins.filter((p) => !dayKey(p.fm.Start))];
  const localeOf = (p) => {
    const l = follow(vault, p.fm.Locale, p.path) ?? (p.fm.Subtype === "Transport" ? follow(vault, p.fm.To, p.path) : null);
    return l?.fm.Type === "Locale" ? l : null;
  };
  const locales = uniq(ordered.map(localeOf));
  const countries = uniq(ordered.map((p) => follow(vault, p.fm.Country, p.path)));
  const stayOn = (k) => stays.find((p) => dayKey(p.fm.Start) <= k && lastNight(p) > k) ?? null;
  const nowStay = phase === "During" ? stayOn(today) ?? stays.filter((p) => dayKey(p.fm.Start) <= today).pop() ?? null : null;
  const here = nowStay ? follow(vault, nowStay.fm.Locale, nowStay.path) : null;
  const first = stays[0] ? follow(vault, stays[0].fm.Locale, stays[0].path) : locales[0] ?? null;
  const dayN = phase === "During" && start ? daysBetween(start, today) + 1 : null;
  return { phase, today, start, end, days, nights, dayN, itins, dated, stays, transport, gaps: gaps2, locales, countries, here, first, stayOn };
}
function locationStatus(vault, note) {
  const field = fieldFor(note), today = vault.today();
  const itins = linking(vault, note, "Itinerary", field);
  const places = linking(vault, note, "Place", field);
  const past = itins.filter((i) => dayKey(i.fm.End) && dayKey(i.fm.End) < today);
  const upcoming = itins.filter((i) => !dayKey(i.fm.End) || dayKey(i.fm.End) >= today);
  const status2 = past.length || places.some((p) => p.fm.Visited) ? "Visited" : upcoming.length ? "Planned" : note.fm.Wishlist || places.length ? "Saved" : "Reference";
  return { status: status2, upcoming, past, places };
}
var coords = (v) => {
  const p = String(v ?? "").split(",").map((x) => parseFloat(x.trim()));
  return p.length === 2 && p.every(Number.isFinite) ? [p[0], p[1]] : null;
};
function km([a1, o1], [a2, o2]) {
  const rad = (x) => x * Math.PI / 180;
  const h = Math.sin(rad(a2 - a1) / 2) ** 2 + Math.cos(rad(a1)) * Math.cos(rad(a2)) * Math.sin(rad(o2 - o1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

// plugins/travel/src/itinerary.ts
var ItinTools = class {
  constructor(vault, icons, t, onEdit) {
    this.vault = vault;
    this.icons = icons;
    this.t = t;
    this.onEdit = onEdit;
  }
  vault;
  icons;
  t;
  onEdit;
  nameOf(v, from) {
    return follow(this.vault, v, from)?.name ?? (this.vault.index.linkName(v).split("/").pop() || "?");
  }
  placeIcon(place) {
    return place ? this.icons.types[place.fm["Primary Type"]] ?? this.icons.groups[place.fm.Group] ?? null : null;
  }
  iconFor(p) {
    if (p.fm.Subtype === "Transport") return this.icons.modes[p.fm.Mode] ?? this.icons.subtypes.Transport ?? "\u{1F686}";
    return this.placeIcon(follow(this.vault, p.fm.Place, p.path)) ?? this.icons.subtypes[p.fm.Subtype] ?? this.icons.default;
  }
  target(p) {
    return (p.fm.Subtype === "Transport" ? follow(this.vault, p.fm.To, p.path) : null) ?? follow(this.vault, p.fm.Place, p.path) ?? follow(this.vault, p.fm.Locale, p.path) ?? follow(this.vault, p.fm.Country, p.path);
  }
  label(p) {
    if (p.fm.Subtype === "Transport") return `${shortName(this.nameOf(p.fm.From, p.path))} \u2192 ${shortName(this.nameOf(p.fm.To, p.path))}${p.fm.Service ? ` \xB7 ${p.fm.Service}` : ""}`;
    return shortName(this.target(p)?.name ?? p.name);
  }
  link(p) {
    const t = this.target(p);
    return t ? `[[${t.path}|${this.label(p)}]]` : this.label(p);
  }
  /** One line in `container`. `when` is shown before the name, e.g. "Sun 20 Dec · 08:00". */
  line(container, p, when, extra = "") {
    const row = container.createDiv({ cls: "travel-itin" });
    this.t.span(row.createSpan({ cls: "travel-itin-text" }), `${this.iconFor(p)} ${when ? when + " \xB7 " : ""}${this.link(p)}${extra}`);
    const b = row.createSpan({ cls: "travel-edit", text: "\u270F\uFE0F", attr: { title: "Edit", role: "button", tabindex: 0 } });
    b.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.onEdit(p);
    });
    return row;
  }
};

// plugins/travel/src/editor.ts
var import_obsidian3 = require("obsidian");
var SUBTYPES = ["Stay", "Activity", "Meal", "Transport"];
var MODES = ["Flight", "Train", "Bus", "Ferry", "Cruise", "Car"];
var ListSuggest = class extends import_obsidian3.AbstractInputSuggest {
  constructor(app, input, items) {
    super(app, input);
    this.input = input;
    this.items = items;
    this.onSelect((v) => {
      this.input.value = v;
      this.input.dispatchEvent(new Event("input"));
      this.close();
    });
  }
  input;
  items;
  getSuggestions(q) {
    const s = q.toLowerCase();
    return this.items().filter((i) => i.toLowerCase().includes(s)).slice(0, 50);
  }
  renderSuggestion(v, el) {
    el.setText(v);
  }
};
var linkName = (v) => String(typeof v === "string" ? v : v?.path ?? "").replace(/^\[\[|\]\]$/g, "").split("|")[0].replace(/\.md$/, "").split("/").pop() ?? "";
var toLink = (name) => name ? `[[${name}]]` : null;
var dateOf = (v) => v ? String(v).slice(0, 10) : "";
var timeOf2 = (v) => v && String(v).length > 10 ? String(v).slice(11, 16) : "";
var shortN = (n) => n.replace(/,[^,]*$/, "");
var safeName = (s) => s.replace(/[*"\\/<>:|?#^[\]]/g, "").trim();
var ItineraryModal = class extends import_obsidian3.Modal {
  constructor(plugin, opts) {
    super(plugin.app);
    this.plugin = plugin;
    this.opts = opts;
  }
  plugin;
  opts;
  onOpen() {
    const app = this.app, s = this.plugin.settings, opts = this.opts;
    const vault = this.plugin.index.scope(new Deps(() => {
    }));
    const fm = opts.file ? { ...app.metadataCache.getFileCache(opts.file)?.frontmatter ?? {} } : { ...opts.initial ?? {} };
    const tripFile = opts.trip ?? (opts.file ? follow(vault, fm.Trip, opts.file.path)?.file ?? null : null);
    const docsRoot = `${s.tripDocumentsFolder}/${tripFile?.basename ?? "<Trip>"}`;
    const names = (folder, type) => vault.inFolder(folder).filter((f) => vault.fm(f).Type === type).map((f) => f.basename).sort();
    const places = () => names(s.placesFolder, "Place"), locales = () => names(s.localesFolder, "Locale");
    const docs = () => tripFile ? vault.filesIn(docsRoot).map((f) => f.path) : [];
    this.setTitle(opts.file ? `Edit ${opts.file.basename}` : `Add to ${tripFile?.basename ?? "trip"}`);
    const el = this.contentEl;
    el.addClass("travel-editor");
    const row = (label, parent = el) => {
      const r = parent.createDiv({ cls: "travel-editor-row" });
      r.createEl("label", { text: label });
      return r.createDiv({ cls: "travel-editor-input" });
    };
    const input = (parent, attr) => parent.createEl("input", { attr });
    const select = (parent, options, value) => {
      const sel = parent.createEl("select", { cls: "dropdown" });
      for (const o of options) sel.createEl("option", { text: o, attr: { value: o } });
      sel.value = value;
      return sel;
    };
    const suggest = (i, items) => new ListSuggest(app, i, items);
    const subtype = select(row("Type"), SUBTYPES, fm.Subtype ?? "Activity");
    const sRow = row("Start");
    const sDate = input(sRow, { type: "date", value: dateOf(fm.Start) });
    const sTime = input(sRow, { type: "time", value: timeOf2(fm.Start) });
    const eRow = row("End");
    const eDate = input(eRow, { type: "date", value: dateOf(fm.End) });
    const eTime = input(eRow, { type: "time", value: timeOf2(fm.End) });
    const place = input(row("Place"), { type: "text", value: linkName(fm.Place), placeholder: "Optional" });
    suggest(place, places);
    const locale = input(row("City / Region"), { type: "text", value: linkName(fm.Locale), placeholder: "Filled from the place if blank" });
    suggest(locale, locales);
    const tBox = el.createDiv({ cls: "travel-editor-transport" });
    const mode = select(row("Mode", tBox), MODES, fm.Mode ?? "Train");
    const from = input(row("From", tBox), { type: "text", value: linkName(fm.From) });
    const to = input(row("To", tBox), { type: "text", value: linkName(fm.To) });
    suggest(from, () => [...locales(), ...places()]);
    suggest(to, () => [...locales(), ...places()]);
    const service = input(row("Service", tBox), { type: "text", value: fm.Service ?? "", placeholder: "e.g. JL 772, Nozomi 23" });
    const showT = () => tBox.toggleClass("vault-hidden", subtype.value !== "Transport");
    subtype.addEventListener("change", showT);
    showT();
    const booking = input(row("Booking"), { type: "text", value: String(fm.Booking ?? "").match(/^\[\[([^\]|]+)/)?.[1] ?? "", placeholder: `File in ${docsRoot}` });
    suggest(booking, docs);
    const conf = input(row("Confirmation"), { type: "text", value: fm.Confirmation ?? "" });
    const buttons = el.createDiv({ cls: "modal-button-container" });
    if (opts.file) buttons.createEl("button", { text: "Open note" }).addEventListener("click", () => {
      this.close();
      void app.workspace.getLeaf(false).openFile(opts.file);
    });
    buttons.createEl("button", { text: "Cancel" }).addEventListener("click", () => this.close());
    const save = buttons.createEl("button", { text: opts.file ? "Save" : "Add", cls: "mod-cta" });
    save.addEventListener("click", async () => {
      if (!tripFile && !opts.file) {
        new import_obsidian3.Notice("No trip to add this to");
        return;
      }
      const stamp2 = (d, t) => d ? t ? `${d}T${t}` : d : null;
      const placeNote = place.value.trim() ? follow(vault, place.value.trim()) : null;
      const localeName = locale.value.trim() || (placeNote?.fm.Locale ? linkName(placeNote.fm.Locale) : "");
      const localeNote = localeName ? follow(vault, localeName) : null;
      const toNoteF = subtype.value === "Transport" && to.value.trim() ? follow(vault, to.value.trim()) : null;
      const country = placeNote?.fm.Country ?? localeNote?.fm.Country ?? (toNoteF?.fm.Type === "Locale" ? toNoteF.fm.Country : null) ?? fm.Country ?? null;
      const values = {
        Type: "Itinerary",
        Subtype: subtype.value,
        Trip: tripFile ? toLink(tripFile.basename) : fm.Trip,
        Start: stamp2(sDate.value, sTime.value),
        End: stamp2(eDate.value, eTime.value),
        Place: toLink(place.value.trim()),
        Locale: toLink(localeName) ?? (toNoteF?.fm.Type === "Locale" ? toLink(toNoteF.name) : null),
        Country: country ? toLink(linkName(country)) : null,
        location: placeNote?.fm.location ?? localeNote?.fm.Coordinates ?? (toNoteF?.fm.Type === "Locale" ? toNoteF.fm.Coordinates : null) ?? null,
        Booking: booking.value.trim() ? `[[${booking.value.trim()}]]` : null,
        Confirmation: conf.value.trim() || null
      };
      if (subtype.value === "Transport") Object.assign(values, { Mode: mode.value, From: toLink(from.value.trim()), To: toLink(to.value.trim()), Service: service.value.trim() || null });
      const what = subtype.value === "Transport" && (from.value || to.value) ? `${shortN(from.value.trim() || "?")} to ${shortN(to.value.trim() || "?")}` : place.value.trim() || shortN(localeName) || (opts.file?.basename.replace(/^(Idea|\d{4}-\d{2}-\d{2}) - /, "") ?? subtype.value);
      const base = safeName(`${sDate.value || "Idea"} - ${what}`);
      let file = opts.file ?? null;
      if (!file) {
        file = await this.plugin.notes.createItinerary(tripFile, base, values);
      } else {
        await app.fileManager.processFrontMatter(file, (f) => {
          for (const [k, v] of Object.entries(values)) f[k] = v;
          if (subtype.value !== "Transport") for (const k of ["Mode", "From", "To", "Service"]) delete f[k];
        });
        if (base !== file.basename) {
          const folder = file.parent?.path ?? "";
          let target = `${folder}/${base}.md`, n = 2;
          while (app.vault.getAbstractFileByPath(target)) target = `${folder}/${base} (${n++}).md`;
          await app.fileManager.renameFile(file, target);
        }
      }
      new import_obsidian3.Notice(`${opts.file ? "Saved" : "Added"} ${file.basename}`);
      this.close();
      opts.onSaved?.(file);
    });
  }
  onClose() {
    this.contentEl.empty();
  }
};
function editItinerary(plugin, file) {
  const fm = plugin.app.metadataCache.getFileCache(file)?.frontmatter;
  if (fm?.Type !== "Itinerary") {
    new import_obsidian3.Notice("Not an itinerary note");
    return;
  }
  new ItineraryModal(plugin, { file }).open();
}

// plugins/travel/src/context.ts
function travelContext(plugin, base) {
  const file = base.input.note ? base.vault.resolve(base.input.note, base.sourcePath) : base.vault.file(base.sourcePath);
  if (!file) throw new Error(`Note not found: ${base.input.note ?? base.sourcePath}`);
  const here = toNote(base.vault, file);
  let itin = null;
  return {
    ...base,
    plugin,
    s: plugin.settings,
    here,
    trip: (trip = here) => base.memo(`trip:${trip.path}`, (vault) => tripData(vault, toNote(vault, trip.file))),
    get itin() {
      return itin ??= new ItinTools(base.vault, plugin.settings.icons, base.t, (n) => editItinerary(plugin, n.file));
    }
  };
}

// plugins/travel/src/navRules.ts
function travelNav(vault, file, s) {
  const page = toNote(vault, file);
  const section = (folder) => ({ path: vault.file(folderNote(folder)) ? folderNote(folder) : null, label: folderLabel(folder) });
  const crumb = (n, label) => n ? { path: n.path, label: label ?? n.name } : null;
  const country = follow(vault, page.fm.Country, page.path);
  let crumbs = null, current = null;
  const type = page.fm.Type;
  if (type === "Country") crumbs = [section(s.countriesFolder)];
  else if (type === "Locale") {
    crumbs = [section(s.countriesFolder), crumb(country)];
    current = shortName(page.name);
  } else if (type === "Place") {
    const locale = follow(vault, page.fm.Locale, page.path);
    crumbs = [section(s.countriesFolder), crumb(country), locale && crumb(locale, shortName(locale.name))];
  } else if (type === "Trip") crumbs = [section(s.tripsFolder)];
  else if (page.fm.Trip) crumbs = [section(s.tripsFolder), crumb(follow(vault, page.fm.Trip, page.path))];
  let right = null;
  const active = activeTrip(vault, s);
  if (active && active.path !== page.path) {
    const today = vault.today(), start = dayKey(active.fm.Start), end = dayKey(active.fm.End);
    right = `${linkTo(active.path)} \xB7 Day ${daysBetween(start, today) + 1}${end ? ` of ${daysBetween(start, end) + 1}` : ""}`;
  }
  let prev = null, next = null;
  const trip = follow(vault, page.fm.Trip, page.path);
  if (type === "Itinerary" && trip && dayKey(page.fm.Start)) {
    const stops = itineraryOf(vault, trip).filter((p) => dayKey(p.fm.Start)).sort(byStart);
    const i = stops.findIndex((p) => p.path === page.path);
    if (i > 0) prev = linkTo(stops[i - 1].path);
    if (i >= 0 && i < stops.length - 1) next = linkTo(stops[i + 1].path);
  }
  return { crumbs: crumbs ? crumbs.filter((c) => !!c) : null, current, right, prev, next };
}

// plugins/travel/src/widgets/trip.ts
var trip_exports = {};
__export(trip_exports, {
  countdown: () => countdown,
  documents: () => documents,
  entryHealth: () => entryHealth,
  gaps: () => gaps,
  packing: () => packing,
  route: () => route,
  todayNext: () => todayNext,
  todos: () => todos,
  tripEssentials: () => tripEssentials,
  tripHere: () => tripHere,
  tripHolidays: () => tripHolidays,
  tripMoney: () => tripMoney,
  tripStatus: () => tripStatus2
});
var import_obsidian5 = require("obsidian");

// packages/shared/src/net.ts
var import_obsidian4 = require("obsidian");
async function requestJson(url, init = {}) {
  try {
    const res = await (0, import_obsidian4.requestUrl)({
      url,
      method: init.method ?? "GET",
      headers: init.headers,
      throw: false,
      ...init.body !== void 0 ? { contentType: "application/json", body: JSON.stringify(init.body) } : {}
    });
    let json = null;
    try {
      json = res.json;
    } catch {
      json = null;
    }
    return { ok: res.status >= 200 && res.status < 300, status: res.status, json, text: res.text };
  } catch (e) {
    console.error(`request failed: ${url}`, e);
    return { ok: false, status: 0, json: null, text: String(e) };
  }
}
async function requestText(url) {
  try {
    const r = await (0, import_obsidian4.requestUrl)({ url, throw: false });
    return r.status >= 200 && r.status < 300 ? r.text : null;
  } catch {
    return null;
  }
}
async function requestBinary(url, headers) {
  try {
    const r = await (0, import_obsidian4.requestUrl)({ url, headers, throw: false });
    return r.status >= 200 && r.status < 300 ? r.arrayBuffer : null;
  } catch {
    return null;
  }
}
async function staleFirst(app, opts) {
  const key = `vault-cache:${opts.key}`;
  let saved = null;
  try {
    saved = app.loadLocalStorage(key);
  } catch {
    saved = null;
  }
  if (saved?.data) opts.draw(saved.data);
  const stale = !saved?.data || (opts.isStale ? opts.isStale(saved) : Date.now() - saved.saved > (opts.maxAgeMs ?? 36e5));
  if (!stale) return;
  const refresh = (async () => {
    try {
      const data = await opts.fetcher();
      if (data) {
        try {
          app.saveLocalStorage(key, { saved: Date.now(), data });
        } catch {
        }
        opts.draw(data);
      } else if (!saved?.data) opts.empty?.();
    } catch (e) {
      console.error(`cache: ${opts.key} refresh failed`, e);
      if (!saved?.data) opts.empty?.();
    }
  })();
  if (!saved?.data) await refresh;
}
async function cached(app, key, maxAgeMs, fetcher) {
  const k = `vault-cache:${key}`;
  try {
    const s = app.loadLocalStorage(k);
    if (s && Date.now() - s.saved < maxAgeMs) return s.data;
  } catch {
  }
  const data = await fetcher();
  if (data !== null) try {
    app.saveLocalStorage(k, { saved: Date.now(), data });
  } catch {
  }
  return data;
}
function secret(app, id) {
  const v = app.secretStorage?.getSecret(id);
  return typeof v === "string" && v ? v : null;
}

// plugins/travel/src/services/live.ts
function drawLocalTime(ctx, el, tz, place) {
  if (!tz) {
    ctx.t.p(el, "<small>Local time unavailable (no Timezone)</small>");
    return;
  }
  const home = ctx.s.homeTimezone, homeName = ctx.s.homeCity || home;
  const offset = (zone, d) => {
    const v = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "";
    const m = v.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (!m) return 0;
    const n = +m[2] * 60 + +(m[3] || 0);
    return m[1] === "-" ? -n : n;
  };
  const box = el.createDiv({ cls: "travel-localtime" });
  const render = () => {
    const now = /* @__PURE__ */ new Date();
    let time, day;
    try {
      time = now.toLocaleTimeString("en-AU", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
      day = now.toLocaleDateString("en-AU", { timeZone: tz, weekday: "short", day: "numeric", month: "short" });
    } catch {
      box.setText(`Unknown timezone "${tz}"`);
      return;
    }
    const diff = offset(tz, now) - offset(home, now), h = Math.abs(diff) / 60;
    const rel = diff === 0 ? `same as ${homeName}` : `${Number.isInteger(h) ? h : h.toFixed(1)} h ${diff > 0 ? "ahead of" : "behind"} ${homeName}`;
    box.empty();
    box.createDiv({ cls: "travel-big", text: time });
    box.createDiv({ text: `${place} \xB7 ${day}` });
    box.createEl("small", { text: rel });
  };
  render();
  const id = window.setInterval(() => {
    if (!box.isConnected) window.clearInterval(id);
    else render();
  }, 3e4);
  ctx.onCleanup(() => window.clearInterval(id));
}
var WMO = (c) => c === 0 ? ["\u2600\uFE0F", "Clear"] : c <= 2 ? ["\u{1F324}\uFE0F", "Partly cloudy"] : c === 3 ? ["\u2601\uFE0F", "Overcast"] : c <= 48 ? ["\u{1F32B}\uFE0F", "Fog"] : c <= 57 ? ["\u{1F326}\uFE0F", "Drizzle"] : c <= 67 ? ["\u{1F327}\uFE0F", "Rain"] : c <= 77 ? ["\u{1F328}\uFE0F", "Snow"] : c <= 82 ? ["\u{1F326}\uFE0F", "Showers"] : c <= 86 ? ["\u{1F328}\uFE0F", "Snow showers"] : ["\u26C8\uFE0F", "Thunderstorm"];
async function drawWeather(ctx, el, ll) {
  if (!ll) {
    ctx.t.p(el, "<small>Weather unavailable (no Coordinates)</small>");
    return;
  }
  const [lat, lng] = ll;
  const box = el.createDiv({ cls: "travel-weather", text: "Loading weather\u2026" });
  const r = (n) => n === null || n === void 0 ? "\u2013" : Math.round(n);
  const draw = (data) => {
    if (!ctx.current()) return;
    box.empty();
    const d = data?.daily;
    if (!d?.time) {
      box.setText("Weather unavailable");
      return;
    }
    const lines = [];
    if (data.current) {
      const [icon, label] = WMO(data.current.weather_code);
      lines.push(`<span class="travel-big">${r(data.current.temperature_2m)}\xB0</span> ${icon} ${label}`);
      lines.push(`<small>Feels like ${r(data.current.apparent_temperature)}\xB0</small>`);
    }
    d.time.forEach((day, i) => {
      const rain = d.precipitation_probability_max?.[i];
      lines.push(`${fmt(day, "ccc")} ${WMO(d.weather_code[i])[0]} ${r(d.temperature_2m_max[i])}\xB0 / ${r(d.temperature_2m_min[i])}\xB0${rain ? ` \xB7 ${rain}%` : ""}`);
    });
    if (d.sunrise?.[0]) lines.push(`\u{1F305} ${d.sunrise[0].slice(11, 16)} \xB7 \u{1F307} ${d.sunset[0].slice(11, 16)}`);
    const uv = d.uv_index_max?.[0], aqi = data.aqi;
    const uvText = uv === null || uv === void 0 ? "" : `UV ${Math.round(uv)} ${uv < 3 ? "low" : uv < 6 ? "moderate" : uv < 8 ? "high" : uv < 11 ? "very high" : "extreme"}`;
    const aqiText = aqi === null || aqi === void 0 ? "" : `Air ${aqi} ${aqi <= 50 ? "good" : aqi <= 100 ? "moderate" : aqi <= 150 ? "poor for some" : aqi <= 200 ? "unhealthy" : "very unhealthy"}`;
    if (uvText || aqiText) lines.push(`<small>${[uvText, aqiText].filter(Boolean).join(" \xB7 ")}</small>`);
    ctx.t.p(box, lines.join("<br>"));
  };
  await staleFirst(ctx.app, {
    key: `weather:${lat.toFixed(3)},${lng.toFixed(3)}`,
    maxAgeMs: 36e5,
    draw,
    empty: () => {
      if (ctx.current()) box.setText("Weather unavailable");
    },
    fetcher: async () => {
      const res = await requestJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&timezone=auto&forecast_days=7&current=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max`);
      if (!res.ok || !res.json) return null;
      const data = res.json;
      const aq = await requestJson(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=auto`);
      data.aqi = aq.ok ? aq.json?.current?.us_aqi ?? null : null;
      return data;
    }
  });
}
async function drawFx(ctx, el, codes) {
  const base = ctx.s.homeCurrency || "AUD";
  const want = codes.filter((c) => c && c !== base);
  if (!want.length) {
    ctx.t.p(el, codes.length ? `<small>Same currency as home (${base})</small>` : "<small>No currencies yet (refresh the country notes)</small>");
    return;
  }
  const box = el.createDiv({ cls: "travel-fx", text: "Loading exchange rate\u2026" });
  const num = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: n < 10 ? 2 : 0 });
  const draw = (data) => {
    if (!ctx.current()) return;
    box.empty();
    const lines = want.filter((c) => data.rates?.[c]).flatMap((c) => {
      const rate = data.rates[c], unit = Math.pow(10, Math.max(0, Math.round(Math.log10(rate))));
      return [`**1 ${base}** \u2248 ${num(rate)} ${c}`, `**${unit.toLocaleString("en-AU")} ${c}** \u2248 ${num(unit / rate)} ${base}`];
    });
    const day = fmt(todayKey(new Date(data.time_last_update_unix * 1e3)), "d LLL");
    ctx.t.p(box, (lines.length ? lines.join("<br>") : `No rate for ${want.join(", ")}`) + `<br><small>Updated ${day}</small>`);
  };
  await staleFirst(ctx.app, {
    key: `fx:${base}`,
    draw,
    isStale: (s) => Date.now() / 1e3 > s.data.time_next_update_unix,
    empty: () => {
      if (ctx.current()) box.setText("Exchange rate unavailable");
    },
    fetcher: async () => {
      const r = await requestJson(`https://open.er-api.com/v6/latest/${base}`);
      return r.ok && r.json?.result === "success" ? r.json : null;
    }
  });
}
function parseIcs(text) {
  return text.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1).map((b) => {
    const g = (k) => (b.match(new RegExp(`^${k}[^:]*:(.*)$`, "m")) || [])[1]?.trim() ?? "";
    const d = g("DTSTART");
    return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: g("SUMMARY"), pub: g("DESCRIPTION").startsWith("Public holiday") };
  });
}
async function googleHolidays(calendar) {
  const id = encodeURIComponent(`${calendar}#holiday@group.v.calendar.google.com`);
  const txt = await requestText(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`);
  return txt ? parseIcs(txt).filter((h) => h.pub).map(({ date, name }) => ({ date, name })).sort((a, b) => a.date.localeCompare(b.date)) : [];
}
var nager = async (url) => {
  const r = await requestJson(url);
  return r.ok && Array.isArray(r.json) ? r.json.filter((h) => h.global).map((h) => ({ date: h.date, name: h.name })) : [];
};
async function upcomingHolidays(ctx, cc, draw, empty) {
  const calendar = ctx.s.holidayCalendars[cc.toUpperCase()];
  await staleFirst(ctx.app, {
    key: `holidays-next:${cc}`,
    maxAgeMs: 864e5,
    empty,
    draw: (all) => {
      const today = todayKey();
      draw(all.filter((h) => h.date >= today));
    },
    fetcher: async () => {
      let list = await nager(`https://date.nager.at/api/v3/NextPublicHolidays/${cc}`);
      if (!list.length && calendar) {
        const today = todayKey();
        list = (await googleHolidays(calendar)).filter((h) => h.date >= today);
      }
      return list.length ? list : null;
    }
  });
}
async function yearHolidays(ctx, cc, year) {
  const calendar = ctx.s.holidayCalendars[cc.toUpperCase()];
  return await cached(ctx.app, `holidays-year:${cc}-${year}`, 7 * 864e5, async () => {
    let list = await nager(`https://date.nager.at/api/v3/PublicHolidays/${year}/${cc}`);
    if (!list.length && calendar) list = (await googleHolidays(calendar)).filter((h) => h.date.startsWith(year));
    return list;
  }) ?? [];
}

// plugins/travel/src/widgets/trip.ts
var cityLink = (n) => linkTo(n.path, shortName(n.name));
var heading = (el, text) => el.createEl("strong", { cls: "travel-heading", text });
function tripStatus2(ctx) {
  const t = ctx.trip();
  const status2 = tripStatus(ctx.here, t.today);
  const dates = t.start ? `${fmt(t.start, "d LLL yyyy")}${t.end ? " \u2013 " + fmt(t.end, "d LLL yyyy") : ""}` : "Dates TBC";
  ctx.t.p(ctx.el.createDiv({ cls: "travel-status-bar" }), `<span class="travel-status travel-status-${status2.toLowerCase()}">${status2}</span> \xB7 ${dates}`);
}
function countdown(ctx) {
  const t = ctx.trip(), box = ctx.el.createDiv({ cls: "travel-countdown" });
  const big = (n, unit) => {
    box.createDiv({ cls: "travel-countdown-big", text: String(n) });
    box.createDiv({ cls: "travel-countdown-unit", text: unit });
  };
  if (t.phase === "Idea") big("\u2014", "Dates TBC");
  else if (t.phase === "Cancelled") big("\u2014", "Cancelled");
  else if (t.phase === "Before") {
    const n = daysBetween(t.today, t.start);
    big(n, n === 1 ? "day to go" : "days to go");
    if (t.first) ctx.t.p(box, `<small>First stop: ${cityLink(t.first)}</small>`);
  } else if (t.phase === "During") {
    big(`Day ${t.dayN}`, t.days ? `of ${t.days}` : "");
    if (t.here) ctx.t.p(box, `<small>In ${cityLink(t.here)}</small>`);
  } else {
    const places = new Set(t.itins.map((p) => follow(ctx.vault, p.fm.Place, p.path)?.path).filter(Boolean)).size;
    big(t.days ?? "\u2014", "days");
    ctx.t.p(box, `<small>${plural(t.countries.length, "country", "countries")} \xB7 ${plural(t.locales.length, "city", "cities")} \xB7 ${plural(places, "place")}</small>`);
  }
}
function tripEssentials(ctx) {
  const t = ctx.trip();
  const links = (list) => list.length ? list.map(cityLink).join(", ") : "\u2014";
  ctx.t.p(ctx.el, [
    `**Start** ${t.start ? fmt(t.start, "ccc d LLL yyyy") : "TBC"}`,
    `**End** ${t.end ? fmt(t.end, "ccc d LLL yyyy") : "TBC"}`,
    `**Length** ${t.days ? `${plural(t.days, "day")} \xB7 ${plural(t.days - 1, "night")}` : "\u2014"}`,
    `**Booked** ${ctx.here.fm.Booked ? "Yes" : "No"}`,
    `**Countries** ${links(t.countries)}`,
    `**Cities** ${links(t.locales)}`
  ].join("<br>"));
}
async function tripHere(ctx) {
  const t = ctx.trip(), city = t.here ?? t.first;
  if (!city) {
    ctx.t.p(ctx.el, "<small>Add a stay to see local time and weather</small>");
    return;
  }
  ctx.t.p(ctx.el, `**${t.here ? "Now in" : "First stop"}** ${cityLink(city)}`);
  drawLocalTime(ctx, ctx.el, city.fm.Timezone, shortName(city.name));
  await drawWeather(ctx, ctx.el, coords(city.fm.Coordinates));
}
async function tripMoney(ctx) {
  const codes = [...new Set(ctx.trip().countries.flatMap((c) => [].concat(c.fm["Currency Codes"] ?? []).map(String)))];
  await drawFx(ctx, ctx.el, codes);
}
function route(ctx) {
  const t = ctx.trip(), box = ctx.el.createDiv({ cls: "travel-route" });
  heading(box.createDiv({ cls: "travel-route-head" }), "Route");
  if (!t.nights.length) {
    box.createDiv({ cls: "travel-muted", text: "Set the trip's Start and End to see the route" });
    return;
  }
  const segs = [];
  for (const k of t.nights) {
    const stay = t.stayOn(k);
    const city = stay ? follow(ctx.vault, stay.fm.Locale, stay.path) : null;
    const id = stay ? city?.path ?? `stay:${stay.path}` : "gap";
    const last = segs[segs.length - 1];
    if (last && last.id === id) last.nights++;
    else segs.push({ id, city, label: city ? shortName(city.name) : stay ? "Stay" : "Unbooked", nights: 1, from: k });
  }
  const hue = (s) => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);
  const bar = box.createDiv({ cls: "travel-route-bar" });
  for (const s of segs) {
    const seg = bar.createDiv({ cls: "travel-route-seg" + (s.id === "gap" ? " is-gap" : "") });
    seg.style.flexGrow = String(s.nights);
    if (s.id !== "gap") seg.style.setProperty("--seg-hue", String(hue(s.id)));
    seg.setAttr("title", `${s.label} \xB7 ${plural(s.nights, "night")} from ${fmt(s.from, "d LLL")}`);
    const lab = seg.createDiv({ cls: "travel-route-label" });
    if (s.city) ctx.t.span(lab, cityLink(s.city));
    else lab.createSpan({ text: s.label });
    lab.createSpan({ cls: "travel-route-nights", text: ` ${s.nights}` });
  }
  const pos = (k) => Math.max(0, Math.min(100, daysBetween(t.start, k) / t.nights.length * 100));
  const marks = box.createDiv({ cls: "travel-route-marks" });
  for (const p of t.transport) {
    const m = marks.createDiv({ cls: "travel-route-mark", text: ctx.itin.iconFor(p) });
    m.style.left = `${pos(dayKey(p.fm.Start))}%`;
    m.setAttr("title", `${fmt(p.fm.Start, "ccc d LLL")} \xB7 ${ctx.itin.label(p)}`);
  }
  if (t.phase === "During") {
    const m = marks.createDiv({ cls: "travel-route-today", attr: { title: "Today" } });
    m.style.left = `${pos(t.today)}%`;
  }
  const ends = box.createDiv({ cls: "travel-route-ends travel-muted" });
  ends.createSpan({ text: fmt(t.start, "d LLL") });
  ends.createSpan({ text: fmt(t.end, "d LLL") });
}
function todayNext(ctx) {
  const t = ctx.trip();
  if (t.phase !== "Before" && t.phase !== "During") {
    ctx.hide();
    return;
  }
  const box = ctx.el.createDiv({ cls: "travel-next" });
  const on = (k) => t.dated.filter((p) => dayKey(p.fm.Start) === k);
  const when = (p) => timeOf(p.fm.Start) ?? (p.fm.Subtype === "Stay" ? "Check in" : "");
  const section = (title, items) => {
    heading(box, title);
    if (!items.length) box.createDiv({ cls: "travel-muted", text: "Nothing planned" });
    for (const p of items) ctx.itin.line(box, p, when(p));
  };
  if (t.phase === "During") {
    section("Today", on(t.today));
    section("Tomorrow", on(addDays(t.today, 1)));
    return;
  }
  const days = [...new Set(t.dated.map((p) => dayKey(p.fm.Start)))].slice(0, 2);
  if (!days.length) {
    section("Next Up", []);
    return;
  }
  for (const k of days) section(fmt(k, "ccc d LLL"), on(k));
}
function gaps(ctx) {
  const t = ctx.trip();
  if (t.phase !== "Before" && t.phase !== "During") {
    ctx.hide();
    return;
  }
  const box = ctx.el.createDiv({ cls: "travel-gaps" });
  heading(box, "Gaps");
  if (!t.gaps.length) {
    box.createDiv({ text: "\u2713 Every night has a bed" });
    return;
  }
  const total = t.gaps.reduce((n, g) => n + g.count, 0);
  box.createDiv({ cls: "travel-muted", text: `${plural(total, "night")} with nowhere to stay` });
  for (const g of t.gaps) box.createDiv({ cls: "travel-gap", text: `\u{1F6CF}\uFE0F ${fmt(g.from, "ccc d LLL")}${g.count > 1 ? " \u2013 " + fmt(g.to, "ccc d LLL") : ""} \xB7 ${plural(g.count, "night")}` });
}
function entryHealth(ctx) {
  const t = ctx.trip();
  heading(ctx.el, "Entry & Health");
  if (!t.countries.length) {
    ctx.t.p(ctx.el, "<small>Countries appear once the trip has itinerary notes</small>");
    return;
  }
  ctx.t.p(ctx.el, t.countries.map((c) => [
    linkTo(c.path),
    `<small>Visa</small> ${c.fm.Visa || "\u2014"} \xB7 <small>Vaccine</small> ${c.fm.Vaccine || c.fm.Vaccines || "\u2014"}`,
    `[Smartraveller](https://www.smartraveller.gov.au/search?search=${encodeURIComponent(c.name)})`
  ].join("<br>")).join("<br><br>"));
}
async function packing(ctx) {
  const t = ctx.trip();
  if (t.phase === "After" || t.phase === "Cancelled") {
    ctx.hide();
    return;
  }
  const trip = ctx.here;
  const note = ctx.vault.inFolder(trip.folder).map((f) => toNote(ctx.vault, f)).find((n) => n.fm.Type === "Packing List" && follow(ctx.vault, n.fm.Trip, n.path)?.path === trip.path) ?? null;
  const tasks = note ? await ctx.vault.tasks(note.file) : [];
  const done = tasks.filter((x) => x.done).length;
  const box = ctx.el.createDiv({ cls: "travel-packing" });
  const head = box.createDiv({ cls: "travel-packing-head" });
  ctx.t.span(head, note ? `**${linkTo(note.path, "Packing")}**` : "**Packing**");
  head.createSpan({ cls: "travel-muted", text: tasks.length ? ` ${done} / ${tasks.length}` : "" });
  box.createDiv({ cls: "travel-meter" }).createDiv({ cls: "travel-meter-fill" }).style.width = `${tasks.length ? Math.round(done / tasks.length * 100) : 0}%`;
  const btn = box.createEl("button", { cls: "travel-small-button", text: note ? "Refresh Packing" : "Create Packing List" });
  btn.addEventListener("click", async () => {
    const app = ctx.app, view = ctx.vault;
    const want = [];
    const base = view.file(ctx.s.packingBaseline);
    if (base) want.push(...(await view.tasks(base)).map((x) => x.text.trim()));
    for (const c of t.countries) want.push(...[].concat(c.fm.Packing ?? []).map(String));
    const have = new Set(tasks.map((x) => x.text.trim().toLowerCase()));
    const missing = [...new Set(want.filter((w) => w && !have.has(w.toLowerCase())))];
    const file = note?.file ?? await ctx.plugin.notes.createPacking(trip.file);
    if (missing.length) await app.vault.process(file, (s) => s.replace(/\n*$/, "\n") + missing.map((m) => `- [ ] ${m}`).join("\n") + "\n");
    new import_obsidian5.Notice(missing.length ? `Added ${plural(missing.length, "item")} to packing` : "Packing list already has everything");
  });
}
async function todos(ctx) {
  const notes = ctx.vault.inFolder(ctx.here.folder).map((f) => toNote(ctx.vault, f)).filter((n) => n.fm.Type !== "Packing List");
  const open = (await Promise.all(notes.map((n) => ctx.vault.tasks(n.file)))).flat().filter((x) => !x.done);
  heading(ctx.el, "To-Dos");
  if (!open.length) {
    ctx.t.p(ctx.el, "<small>Nothing to do. Add tasks to any note in this trip</small>");
    return;
  }
  const list = ctx.el.createDiv({ cls: "travel-todo-list" });
  for (const task of open) {
    const row = list.createEl("label", { cls: "travel-todo-row" });
    const tick = row.createEl("input", { type: "checkbox" });
    ctx.t.span(row, `${task.text} <small>\xB7 ${linkTo(task.path)}</small>`);
    tick.addEventListener("change", async () => {
      if (tick.checked) {
        row.addClass("is-done");
        await setTask(ctx.app, task, true);
      }
    });
  }
}
async function tripHolidays(ctx) {
  const t = ctx.trip();
  if (!t.start || !t.end || t.phase === "Cancelled") {
    ctx.hide();
    return;
  }
  const box = ctx.el.createDiv({ cls: "travel-holidays" });
  heading(box, "Holidays During Trip");
  const list = box.createDiv({ text: "Loading\u2026" });
  const years = [.../* @__PURE__ */ new Set([t.start.slice(0, 4), t.end.slice(0, 4)])];
  const found = [];
  for (const c of t.countries) {
    const cc = c.fm["Country Code"];
    if (!cc) continue;
    for (const y of years) for (const h of await yearHolidays(ctx, String(cc), y)) if (h.date >= t.start && h.date <= t.end) found.push({ ...h, country: c.name });
  }
  if (!ctx.current()) return;
  list.empty();
  if (!found.length) {
    list.addClass("travel-muted");
    list.setText("None during the trip");
    return;
  }
  const multi = t.countries.length > 1;
  found.sort((a, b) => a.date.localeCompare(b.date));
  for (const h of found) list.createDiv({ text: `${fmt(h.date, "ccc d LLL")} \xB7 ${h.name}${multi ? ` (${h.country})` : ""}` });
}
function documents(ctx) {
  const t = ctx.trip(), trip = ctx.here;
  const folder = `${ctx.s.tripDocumentsFolder}/${trip.name}`;
  const fileOf = (l) => ctx.vault.resolve(l, trip.path);
  const icon = (ext) => ({ pdf: "\u{1F4C4}", png: "\u{1F5BC}\uFE0F", jpg: "\u{1F5BC}\uFE0F", jpeg: "\u{1F5BC}\uFE0F", heic: "\u{1F5BC}\uFE0F", eml: "\u2709\uFE0F", md: "\u{1F4DD}" })[ext] ?? "\u{1F4CE}";
  const groups = { "Transport": [], "Stays": [], "Insurance & Entry": [], "Other": [] };
  const used = /* @__PURE__ */ new Set();
  for (const l of [].concat(trip.fm.Documents ?? [])) {
    const f = fileOf(l);
    if (!f) continue;
    used.add(f.path);
    groups[/insur|visa|eta\b|esta|evisa|passport|vaccin/i.test(f.basename) ? "Insurance & Entry" : "Other"].push({ path: f.path, ext: f.extension, note: "" });
  }
  for (const p of t.itins) {
    const f = fileOf(p.fm.Booking);
    if (!f) continue;
    used.add(f.path);
    const g = p.fm.Subtype === "Transport" ? "Transport" : p.fm.Subtype === "Stay" ? "Stays" : "Other";
    groups[g].push({ path: f.path, ext: f.extension, note: ` <small>${ctx.itin.iconFor(p)} ${ctx.itin.label(p)}${p.fm.Confirmation ? " \xB7 " + p.fm.Confirmation : ""}</small>` });
  }
  const loose = ctx.vault.filesIn(folder).filter((f) => !used.has(f.path));
  if (loose.length) groups["Unfiled"] = loose.map((f) => ({ path: f.path, ext: f.extension, note: "" }));
  const box = ctx.el.createDiv({ cls: "travel-docs" });
  if (!Object.values(groups).some((g) => g.length)) {
    box.createDiv({ cls: "travel-muted", text: `No documents yet. Put files in ${folder} and link them from a Booking or the trip's Documents` });
    return;
  }
  for (const [name, items] of Object.entries(groups)) {
    if (!items.length) continue;
    const col = box.createDiv({ cls: "travel-docs-group" });
    heading(col, name);
    for (const it of items) ctx.t.div(col, `${icon(it.ext)} ${linkTo(it.path)}${it.note}`);
  }
}

// plugins/travel/src/widgets/location.ts
var location_exports = {};
__export(location_exports, {
  climate: () => climate,
  comingUp: () => comingUp,
  fromCountry: () => fromCountry,
  fx: () => fx,
  history: () => history,
  holidays: () => holidays,
  localTime: () => localTime,
  nearby: () => nearby,
  neighbourhoods: () => neighbourhoods,
  status: () => status,
  trips: () => trips2,
  weather: () => weather,
  yetToVisit: () => yetToVisit
});
var import_obsidian6 = require("obsidian");

// plugins/travel/src/services/climate.ts
async function climateFor(app, lat, lng) {
  const key = `climate:${lat.toFixed(2)},${lng.toFixed(2)}`;
  return cached(app, key, 365 * 864e5, async () => {
    const y = (/* @__PURE__ */ new Date()).getFullYear() - 1;
    const res = await requestJson(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${y - 9}-01-01&end_date=${y}-12-31&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
    const d = res.json?.daily;
    if (!res.ok || !d?.time?.length) return null;
    return summarise(d);
  });
}
function summarise(d) {
  const M = Array.from({ length: 12 }, () => ({ hi: [], lo: [], rain: 0, years: /* @__PURE__ */ new Set() }));
  d.time.forEach((t, i) => {
    const m = M[Number(t.slice(5, 7)) - 1];
    if (d.temperature_2m_max[i] !== null) m.hi.push(d.temperature_2m_max[i]);
    if (d.temperature_2m_min[i] !== null) m.lo.push(d.temperature_2m_min[i]);
    m.rain += d.precipitation_sum[i] ?? 0;
    m.years.add(t.slice(0, 4));
  });
  const avg = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  const rows = M.map((m) => ({ hi: avg(m.hi), lo: avg(m.lo), rain: m.rain / (m.years.size || 1) }));
  const medianRain = [...rows].map((r) => r.rain).sort((a, b) => a - b)[6];
  return {
    months: rows.map((r) => [Math.round(r.hi), Math.round(r.lo), Math.round(r.rain)]),
    best: rows.map((r) => r.hi >= 18 && r.hi <= 28 && r.rain <= medianRain)
  };
}

// plugins/travel/src/widgets/location.ts
var heading2 = (el, text) => el.createEl("strong", { cls: "travel-heading", text });
var cityLink2 = (n) => linkTo(n.path, shortName(n.name));
function status(ctx) {
  const here = ctx.here, today = ctx.vault.today();
  const { status: status2, upcoming } = locationStatus(ctx.vault, here);
  const next = [...upcoming].sort((a, b) => (stamp(a.fm.Start) ?? Number.MAX_SAFE_INTEGER) - (stamp(b.fm.Start) ?? Number.MAX_SAFE_INTEGER))[0];
  let nextText = "";
  if (next) {
    const trip = follow(ctx.vault, next.fm.Trip, next.path);
    const start = dayKey(next.fm.Start) ?? dayKey(trip?.fm.Start);
    const place = follow(ctx.vault, next.fm.Place, next.path);
    const name = trip ? linkTo(trip.path) : place ? linkTo(place.path) : "a plan";
    nextText = !start ? `Next visit: ${name} \xB7 dates TBC` : start <= today ? `Now \xB7 ${name}` : `Next visit: ${name} \xB7 in ${daysBetween(today, start)} days`;
  }
  ctx.t.p(ctx.el.createDiv({ cls: "travel-status-bar" }), `<span class="travel-status travel-status-${status2.toLowerCase()}">${status2}</span>${nextText ? " \xB7 " + nextText : ""}`);
}
async function fromCountry(ctx) {
  const c = follow(ctx.vault, ctx.here.fm.Country, ctx.here.path);
  if (!c) {
    ctx.el.setText("No country note linked");
    return;
  }
  const list = (v) => (Array.isArray(v) ? v.join(", ") : v ? String(v) : "") || "\u2014";
  ctx.t.p(ctx.el, `**From** ${linkTo(c.path)}`);
  ctx.t.p(ctx.el, [`**Plugs** ${list(c.fm.Plugs)}`, `**Emergency** ${c.fm["Emergency Number"] || "\u2014"}`, `**Tipping** ${c.fm.Tipping || "\u2014"}`].join("<br>"));
  await drawFx(ctx, ctx.el, [].concat(c.fm["Currency Codes"] ?? []).map(String));
}
function localTime(ctx) {
  const here = ctx.here;
  const place = here.fm.Type === "Country" ? shortName(follow(ctx.vault, here.fm.Capital, here.path)?.name ?? ctx.vault.index.linkName(here.fm.Capital) ?? here.name) || here.name : shortName(here.name);
  drawLocalTime(ctx, ctx.el, here.fm.Timezone, place);
}
async function weather(ctx) {
  await drawWeather(ctx, ctx.el, coords(ctx.here.fm.Coordinates));
}
async function fx(ctx) {
  await drawFx(ctx, ctx.el, [].concat(ctx.here.fm["Currency Codes"] ?? []).map(String));
}
async function climate(ctx) {
  const box = ctx.el.createDiv({ cls: "travel-climate" });
  const ll = coords(ctx.here.fm.Coordinates);
  if (!ll) {
    box.setText("Climate needs Coordinates");
    return;
  }
  const tripMonths = new Set(linking(ctx.vault, ctx.here, "Itinerary", "Locale").map((p) => dayKey(p.fm.Start)).filter(Boolean).map((k) => Number(k.slice(5, 7)) - 1));
  const loading = box.createDiv({ cls: "travel-muted", text: "Working out the best time to visit\u2026" });
  const data = await climateFor(ctx.app, ll[0], ll[1]);
  if (!ctx.current()) return;
  loading.remove();
  if (!data) {
    box.setText("Climate data unavailable");
    return;
  }
  const { months, best } = data;
  const ranges = [];
  for (let i = 0; i < 12; i++) {
    if (!best[i] || i > 0 && best[i - 1]) continue;
    let j = i;
    while (j < 11 && best[j + 1]) j++;
    ranges.push(i === j ? MONTHS_SHORT[i] : `${MONTHS_SHORT[i]}\u2013${MONTHS_SHORT[j]}`);
  }
  const head = box.createDiv({ cls: "travel-climate-head" });
  heading2(head, "Best Time to Visit");
  head.createSpan({ cls: "travel-sep", text: "\xB7" });
  head.appendText(ranges.length ? ranges.join(", ") : "no standout months");
  box.createEl("small", { text: "A guide: mild highs (18\u201328\xB0) and below-average rain, from 10-year averages." });
  const thisMonth = (/* @__PURE__ */ new Date()).getMonth();
  const hue = (t) => Math.max(0, Math.min(220, 220 - (t + 5) * 6.3));
  const maxRain = Math.max(...months.map((m) => m[2]), 1);
  const grid = box.createDiv({ cls: "travel-climate-grid" });
  months.forEach(([hi, lo, rain], i) => {
    const tile = grid.createDiv({ cls: "travel-climate-month" + (best[i] ? " is-best" : "") + (i === thisMonth ? " is-now" : "") });
    tile.style.setProperty("--tile-hue", String(hue(hi)));
    const top = tile.createDiv({ cls: "travel-climate-name", text: MONTHS_SHORT[i] });
    if (best[i]) top.createSpan({ cls: "travel-climate-badge", text: "\u2605" });
    if (tripMonths.has(i)) top.createSpan({ cls: "travel-climate-badge", text: "\u2708\uFE0F", attr: { title: "You have a trip here this month" } });
    tile.createDiv({ cls: "travel-climate-hi", text: `${hi}\xB0` });
    tile.createDiv({ cls: "travel-climate-lo", text: `${lo}\xB0` });
    const r = tile.createDiv({ cls: "travel-climate-rain" });
    r.createDiv({ cls: "travel-climate-rainbar" }).style.width = `${Math.round(rain / maxRain * 100)}%`;
    r.createSpan({ text: `${rain} mm` });
  });
}
async function holidays(ctx) {
  const cc = String(ctx.here.fm["Country Code"] ?? "");
  heading2(ctx.el, "Holidays");
  if (!cc) {
    ctx.t.p(ctx.el, "<small>No Country Code</small>");
    return;
  }
  const windows = linking(ctx.vault, ctx.here, "Itinerary", "Country").map((i) => follow(ctx.vault, i.fm.Trip, i.path)).filter((t) => !!t && !!dayKey(t.fm.Start) && !!dayKey(t.fm.End)).map((t) => ({ name: t.name, start: dayKey(t.fm.Start), end: dayKey(t.fm.End) }));
  const box = ctx.el.createDiv({ text: "Loading\u2026" });
  const inTrip = (d) => windows.find((w) => d >= w.start && d <= w.end);
  await upcomingHolidays(ctx, cc, (list) => {
    if (!ctx.current()) return;
    box.empty();
    if (!list.length) {
      box.setText("No holiday data");
      return;
    }
    const shown = [...list.slice(0, 3), ...list.slice(3).filter((h) => inTrip(h.date))];
    ctx.t.p(box, shown.map((h) => {
      const t = inTrip(h.date);
      return `${fmt(h.date, "d LLL")} \xB7 ${h.name}${t ? ` <small>(during ${t.name})</small>` : ""}`;
    }).join("<br>"));
  }, () => {
    if (ctx.current()) box.setText("No holiday data");
  });
}
function comingUp(ctx) {
  const here = ctx.here, field = fieldFor(here), limit = Number(ctx.input.limit ?? 6), today = ctx.vault.today();
  const all = linking(ctx.vault, here, "Itinerary", field);
  const items = all.filter((p) => dayKey(p.fm.Start) && (dayKey(p.fm.End) ?? dayKey(p.fm.Start)) >= today).sort(byStart);
  const ideas = all.filter((p) => !dayKey(p.fm.Start)).length;
  if (!items.length && !ideas) {
    ctx.hide();
    return;
  }
  const box = ctx.el.createDiv({ cls: "travel-plan" });
  heading2(box, "Coming Up");
  for (const p of items.slice(0, limit)) {
    const when = fmt(p.fm.Start, "ccc d LLL") + (timeOf(p.fm.Start) ? ` \xB7 ${timeOf(p.fm.Start)}` : "");
    const city = field === "Country" ? follow(ctx.vault, p.fm.Locale, p.path) : null;
    const showCity = city && ctx.itin.target(p)?.path !== city.path;
    ctx.itin.line(box, p, when, showCity ? ` <small>\xB7 ${shortName(city.name)}</small>` : "");
  }
  if (items.length > limit) box.createDiv({ cls: "travel-muted", text: `+ ${items.length - limit} more` });
  if (ideas) box.createDiv({ cls: "travel-muted", text: `${ideas} undated idea${ideas === 1 ? "" : "s"}` });
}
function yetToVisit(ctx) {
  const limit = Number(ctx.input.limit ?? 8);
  const todo = linking(ctx.vault, ctx.here, "Place", fieldFor(ctx.here)).filter((p) => !p.fm.Visited).sort((a, b) => (Number(b.fm.Rating) || 0) - (Number(a.fm.Rating) || 0));
  const box = ctx.el.createDiv({ cls: "travel-todo" });
  heading2(box, "Yet to Visit");
  if (!todo.length) {
    box.createDiv({ cls: "travel-muted", text: "Nothing saved that you haven't been to" });
    return;
  }
  const list = box.createDiv({ cls: "travel-todo-list" });
  for (const p of todo.slice(0, limit)) {
    const row = list.createEl("label", { cls: "travel-todo-row" });
    const tick = row.createEl("input", { type: "checkbox" });
    ctx.t.span(row, `${ctx.itin.placeIcon(p) ?? ctx.s.icons.default} ${linkTo(p.path)}${p.fm.Rating ? ` <small>\u2605 ${p.fm.Rating}</small>` : ""}`);
    tick.addEventListener("change", async () => {
      if (!tick.checked) return;
      await ctx.app.fileManager.processFrontMatter(p.file, (fm) => {
        fm.Visited = true;
        fm["Last Visited"] = todayKey();
      });
      row.addClass("is-done");
      new import_obsidian6.Notice(`Marked ${p.name} as visited`);
    });
  }
  if (todo.length > limit) box.createDiv({ cls: "travel-muted", text: `+ ${todo.length - limit} more` });
}
function history(ctx) {
  const here = ctx.here, field = fieldFor(here), today = ctx.vault.today();
  const places = linking(ctx.vault, here, "Place", field);
  const itins = linking(ctx.vault, here, "Itinerary", field);
  const dates = [
    ...places.filter((p) => p.fm.Visited && dayKey(p.fm["Last Visited"])).map((p) => dayKey(p.fm["Last Visited"])),
    ...itins.filter((i) => dayKey(i.fm.End) && dayKey(i.fm.End) < today).map((i) => dayKey(i.fm.End))
  ].sort().reverse();
  ctx.t.p(ctx.el, [`**Places saved** ${places.length}`, `**Places visited** ${places.filter((p) => p.fm.Visited).length}`, `**Last visited** ${dates.length ? fmt(dates[0], "LLL yyyy") : "never"}`].join("<br>"));
  if (!ctx.input.stays) return;
  const stays = itins.filter((i) => i.fm.Subtype === "Stay" && dayKey(i.fm.Start) && (!dayKey(i.fm.End) || dayKey(i.fm.End) < today)).sort(byStart).reverse();
  const covered = new Set(stays.map((i) => follow(ctx.vault, i.fm.Place, i.path)?.path).filter(Boolean));
  const extra = places.filter((p) => p.fm.Group === "Stay" && p.fm.Visited && !covered.has(p.path));
  const lines = [
    ...stays.map((i) => {
      const pl = follow(ctx.vault, i.fm.Place, i.path), city = follow(ctx.vault, i.fm.Locale, i.path);
      return `${pl ? linkTo(pl.path) : city ? cityLink2(city) : "Stay"} \xB7 ${fmt(i.fm.Start, "LLL yyyy")}`;
    }),
    ...extra.map((p) => `${linkTo(p.path)}${dayKey(p.fm["Last Visited"]) ? " \xB7 " + fmt(p.fm["Last Visited"], "LLL yyyy") : ""}`)
  ];
  ctx.t.p(ctx.el, `**Where I've Stayed**<br>${lines.length ? lines.join("<br>") : "<small>Nowhere yet</small>"}`);
}
function trips2(ctx) {
  const seen = /* @__PURE__ */ new Set(), today = ctx.vault.today();
  const list = linking(ctx.vault, ctx.here, "Itinerary", fieldFor(ctx.here)).map((i) => follow(ctx.vault, i.fm.Trip, i.path)).filter((t) => !!t && !seen.has(t.path) && !!seen.add(t.path)).sort((a, b) => (dayKey(b.fm.Start) ?? "").localeCompare(dayKey(a.fm.Start) ?? ""));
  heading2(ctx.el, "Trips");
  if (!list.length) {
    ctx.t.p(ctx.el, "No trips yet");
    return;
  }
  ctx.t.p(ctx.el, list.map((t) => {
    const start = dayKey(t.fm.Start), end = dayKey(t.fm.End);
    const range = start ? `${fmt(start, "d LLL yyyy")}${end ? " \u2013 " + fmt(end, "d LLL yyyy") : ""}` : "dates TBC";
    return `${linkTo(t.path)} \xB7 ${range} \xB7 ${tripStatus(t, today)}`;
  }).join("<br>"));
}
function neighbourhoods(ctx) {
  const places = linking(ctx.vault, ctx.here, "Place", "Locale").filter((p) => p.fm.Area);
  if (!places.length) {
    ctx.t.p(ctx.el, "Neighbourhoods appear once places have an Area");
    return;
  }
  const groups = /* @__PURE__ */ new Map();
  for (const p of places) {
    const k = String(p.fm.Area);
    groups.set(k, [...groups.get(k) ?? [], p]);
  }
  ctx.t.p(ctx.el, [...groups.entries()].sort((a, b) => b[1].length - a[1].length).map(([area, list]) => `**${area}** \xB7 ${list.sort((a, b) => a.name.localeCompare(b.name)).map((p) => linkTo(p.path)).join(", ")}`).join("<br>"));
}
function nearby(ctx) {
  const me = coords(ctx.here.fm.Coordinates);
  if (!me) {
    ctx.t.p(ctx.el, "No coordinates yet");
    return;
  }
  const radius = ctx.s.nearbyRadiusKm;
  const near = ctx.vault.inFolder(ctx.s.localesFolder).map((f) => toNote(ctx.vault, f)).filter((n) => n.fm.Type === "Locale" && n.path !== ctx.here.path).map((n) => ({ n, ll: coords(n.fm.Coordinates) })).filter((x) => !!x.ll).map((x) => ({ n: x.n, d: km(me, x.ll) })).filter((x) => x.d <= radius).sort((a, b) => a.d - b.d);
  if (!near.length) {
    ctx.t.p(ctx.el, `None within ${radius} km yet`);
    return;
  }
  ctx.t.p(ctx.el, near.map((x) => `${cityLink2(x.n)} \xB7 ${Math.round(x.d)} km`).join("<br>"));
}

// plugins/travel/src/widgets/index.ts
var WIDGETS = {
  ...trip_exports,
  ...location_exports
};

// plugins/travel/src/notes.ts
var import_obsidian7 = require("obsidian");
function yamlValue(v) {
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (Array.isArray(v)) return JSON.stringify(v);
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(s)) return s;
  if (/^[A-Za-z][A-Za-z0-9 _&'.-]*$/.test(s) && !/\s$/.test(s) && !/^(true|false|yes|no|on|off|null)$/i.test(s)) return s;
  return JSON.stringify(s);
}
function freePath(app, folder, base) {
  let p = (0, import_obsidian7.normalizePath)(`${folder}/${base}.md`), n = 2;
  while (app.vault.getAbstractFileByPath(p)) p = (0, import_obsidian7.normalizePath)(`${folder}/${base} (${n++}).md`);
  return p;
}
async function ensureFolder(app, path) {
  const parts = (0, import_obsidian7.normalizePath)(path).split("/");
  for (let i = 1; i <= parts.length; i++) {
    const p = parts.slice(0, i).join("/");
    if (!app.vault.getAbstractFileByPath(p)) await app.vault.createFolder(p).catch(() => {
    });
  }
}
var NoteMaker = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  plugin;
  get app() {
    return this.plugin.app;
  }
  /** Values every template can use. */
  common(title) {
    const s = this.plugin.settings;
    return { title, basesFolder: s.basesFolder, tripsFolder: s.tripsFolder, mapSource: s.mapSourceIndex, countriesFolder: s.countriesFolder, localesFolder: s.localesFolder };
  }
  async createItinerary(trip, base, fm) {
    const path = freePath(this.app, trip.parent?.path ?? "", base);
    const title = path.split("/").pop().replace(/\.md$/, "");
    const text = await this.plugin.templates.build("Itinerary", { ...this.common(title), trip: trip.basename }, fm);
    return this.app.vault.create(path, text);
  }
  async createPacking(trip) {
    const path = freePath(this.app, trip.parent?.path ?? "", `Packing - ${trip.basename}`);
    const text = await this.plugin.templates.build("Packing List", { ...this.common(`Packing - ${trip.basename}`), trip: trip.basename });
    return this.app.vault.create(path, text);
  }
};

// plugins/travel/src/templates.ts
var import_obsidian8 = require("obsidian");
var Templates = class {
  constructor(plugin) {
    this.plugin = plugin;
  }
  plugin;
  path(name) {
    return (0, import_obsidian8.normalizePath)(`${this.plugin.settings.templatesFolder}/${name}.md`);
  }
  async read(name) {
    const f = this.plugin.app.vault.getAbstractFileByPath(this.path(name));
    if (!f) throw new Error(`Template not found: ${this.path(name)} (Settings \u2192 Travel \u2192 Templates Folder)`);
    return this.plugin.app.vault.read(f);
  }
  /** Note text from a template. `owned` = frontmatter the command sets; `old` = the note's current frontmatter. */
  async build(name, values, owned = {}, old = {}) {
    return compose(await this.read(name), values, owned, old);
  }
};
var fill = (text, values) => text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, k) => k in values ? String(values[k]) : m);
function compose(template, values, owned = {}, old = {}) {
  const m = template.replace(/\r/g, "").match(/^---\n([\s\S]*?)\n---\n?/);
  const defaults = m ? (0, import_obsidian8.parseYaml)(fill(m[1], values)) ?? {} : {};
  const body = fill(m ? template.replace(/\r/g, "").slice(m[0].length) : template, values);
  const has = (o, k) => o[k] !== void 0 && o[k] !== null;
  const fm = {};
  for (const k of Object.keys(defaults)) {
    fm[k] = k === "Type" || k === "cssclasses" ? defaults[k] : has(owned, k) ? owned[k] : has(old, k) ? old[k] : defaults[k];
  }
  for (const [k, v] of Object.entries(owned)) if (!(k in fm)) fm[k] = v;
  for (const [k, v] of Object.entries(old)) if (!(k in fm) && k !== "position") fm[k] = v;
  return `---
${frontmatter(fm)}
---
${body}`;
}
function frontmatter(fm) {
  return Object.entries(fm).map(([k, v]) => {
    if (v === null || v === void 0 || v === "") return `${k}:${v === "" ? ' ""' : ""}`;
    if (Array.isArray(v)) return v.length ? `${k}:
${v.map((x) => `  - ${yamlValue(x)}`).join("\n")}` : `${k}: []`;
    return `${k}: ${yamlValue(v)}`;
  }).join("\n");
}

// plugins/travel/src/commands/trips.ts
var import_obsidian10 = require("obsidian");

// plugins/travel/src/services/google.ts
var import_obsidian9 = require("obsidian");
function googleKey(app, s) {
  const k = secret(app, s.googleSecret) ?? app.plugins?.getPlugin?.("obsidian-map-view")?.settings?.geocodingApiKey;
  if (!k) throw new Error(`No Google API key. Add a "${s.googleSecret}" secret in Settings \u2192 Keychain.`);
  return k;
}
async function placeSearch(app, s, query, fields) {
  const res = await requestJson("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "X-Goog-Api-Key": googleKey(app, s), "X-Goog-FieldMask": fields.map((f) => `places.${f}`).join(",") },
    body: { textQuery: query, pageSize: 1 }
  });
  return { status: res.status, place: res.json?.places?.[0] ?? null };
}
async function placePhoto(app, s, photoName) {
  const key = googleKey(app, s);
  const media = await requestJson(`https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1600&skipHttpRedirect=true&key=${encodeURIComponent(key)}`);
  const uri = media.json?.photoUri;
  return uri ? requestBinary(uri) : null;
}
var sha = async (buf) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf))).map((b) => b.toString(16).padStart(2, "0")).join("");
function pickImage(app, paths, title) {
  return new Promise((resolve) => {
    let chosen = 0;
    const modal = new class extends import_obsidian9.Modal {
      onOpen() {
        this.setTitle(title);
        this.modalEl.addClass("travel-image-picker");
        const grid = this.contentEl.createDiv({ cls: "travel-image-grid" });
        paths.forEach((p, i) => {
          const cell = grid.createDiv({ cls: "travel-image-cell" });
          const img = cell.createEl("img", { attr: { src: app.vault.adapter.getResourcePath(p) } });
          cell.createDiv({ text: `Photo ${i + 1}` });
          img.addEventListener("click", () => {
            chosen = i;
            this.close();
          });
        });
      }
      onClose() {
        resolve(chosen);
      }
    }(app);
    modal.open();
  });
}
async function chooseCover(app, s, opts) {
  const a = app.vault.adapter;
  if (await a.exists(opts.final)) return opts.final;
  await ensureFolder(app, opts.dir);
  const cands = [];
  for (let i = 1; i <= s.coverCandidates; i++) {
    const p = `${opts.dir}/${opts.stem}-${i}.jpg`;
    if (await a.exists(p)) cands.push(p);
  }
  if (!cands.length) {
    const photos = opts.photos ?? (await placeSearch(app, s, opts.query, ["id", "photos"])).place?.photos ?? [];
    const skipHash = opts.skip && await a.exists(opts.skip) ? await sha(await a.readBinary(opts.skip)) : null;
    for (const photo of photos) {
      if (cands.length >= s.coverCandidates) break;
      const buf = await placePhoto(app, s, photo.name);
      if (!buf || skipHash && await sha(buf) === skipHash) continue;
      const p = `${opts.dir}/${opts.stem}-${cands.length + 1}.jpg`;
      await a.writeBinary(p, buf);
      cands.push(p);
    }
  }
  if (!cands.length) return "";
  const idx = cands.length === 1 ? 0 : await pickImage(app, cands, opts.title);
  await a.rename(cands[idx], opts.final);
  for (const p of cands) if (p !== cands[idx] && await a.exists(p)) await a.remove(p);
  return opts.final;
}

// plugins/travel/src/commands/trips.ts
var quiet = (plugin) => plugin.index.scope(new Deps(() => {
}));
var typeOf = (plugin, f) => f ? plugin.app.metadataCache.getFileCache(f)?.frontmatter?.Type : void 0;
var NewTripModal = class extends import_obsidian10.Modal {
  constructor(plugin, done) {
    super(plugin.app);
    this.plugin = plugin;
    this.done = done;
  }
  plugin;
  done;
  name = "";
  start = "";
  end = "";
  onOpen() {
    this.setTitle("New Trip");
    const el = this.contentEl;
    new import_obsidian10.Setting(el).setName("Name").addText((t) => {
      t.setPlaceholder("Christmas 2026").onChange((v) => this.name = v);
      window.setTimeout(() => t.inputEl.focus(), 0);
    });
    const date = (label, desc, set) => new import_obsidian10.Setting(el).setName(label).setDesc(desc).addText((t) => {
      t.inputEl.type = "date";
      t.onChange(set);
    });
    date("Start", "Leave blank while it's only an idea.", (v) => this.start = v);
    date("End", "The day you fly home.", (v) => this.end = v);
    new import_obsidian10.Setting(el).addButton((b) => b.setButtonText("Create").setCta().onClick(() => {
      const name = safeName(this.name);
      if (!name) {
        new import_obsidian10.Notice("Give the trip a name");
        return;
      }
      if (this.plugin.app.vault.getAbstractFileByPath(`${this.plugin.settings.tripsFolder}/${name}`)) {
        new import_obsidian10.Notice(`A trip called "${name}" already exists`);
        return;
      }
      if (this.end && this.start && this.end < this.start) {
        new import_obsidian10.Notice("End is before Start");
        return;
      }
      this.close();
      this.done({ name, start: this.start, end: this.start ? this.end : "" });
    }));
  }
  onClose() {
    this.contentEl.empty();
  }
};
function newTrip(plugin) {
  new NewTripModal(plugin, async ({ name, start, end }) => {
    try {
      const s = plugin.settings, app = plugin.app;
      const folder = `${s.tripsFolder}/${name}`;
      await ensureFolder(app, folder);
      const text = await plugin.templates.build("Trip", { ...plugin.notes.common(name), folder }, { Start: start || null, End: end || null });
      const file = await app.vault.create(`${folder}/${name}.md`, text);
      await plugin.notes.createPacking(file);
      if (s.tripDocumentsFolder) await ensureFolder(app, `${s.tripDocumentsFolder}/${name}`);
      await app.workspace.getLeaf(false).openFile(file);
      new import_obsidian10.Notice(`Trip "${name}" created`);
    } catch (e) {
      console.error(e);
      new import_obsidian10.Notice(`New Trip failed: ${e.message}`, 8e3);
    }
  }).open();
}
async function refreshTrip(plugin, file = plugin.app.workspace.getActiveFile()) {
  if (!file || typeOf(plugin, file) !== "Trip") {
    new import_obsidian10.Notice("Open a trip note first");
    return;
  }
  try {
    const app = plugin.app, s = plugin.settings, vault = quiet(plugin);
    const old = { ...app.metadataCache.getFileCache(file)?.frontmatter ?? {} };
    const owned = {};
    if (!old.Banner) {
      const trip = toNote(vault, file);
      const firstStay = vault.inFolder(trip.folder).map((f) => toNote(vault, f)).filter((n) => n.fm.Type === "Itinerary" && n.fm.Subtype === "Stay" && dayKey(n.fm.Start) && n.fm.Country && follow(vault, n.fm.Trip, n.path)?.path === trip.path).sort(byStart)[0];
      const country = firstStay ? follow(vault, firstStay.fm.Country, firstStay.path) : null;
      if (country) {
        const dir = `${s.tripImagesFolder}/${file.basename}`;
        const cover = await chooseCover(app, s, {
          query: country.name,
          dir,
          final: `${dir}/${file.basename}.jpg`,
          stem: file.basename,
          title: `Choose a cover for ${file.basename}`,
          skip: vault.index.linkName(country.fm.Banner)
        });
        if (cover) owned.Banner = `[[${cover}]]`;
      }
    }
    const text = await plugin.templates.build("Trip", { ...plugin.notes.common(file.basename), folder: file.parent?.path ?? "" }, owned, old);
    await app.vault.modify(file, text);
    new import_obsidian10.Notice(`Trip "${file.basename}" refreshed${old.Banner || owned.Banner ? "" : ". Add a stay to pick a cover"}`);
  } catch (e) {
    console.error(e);
    new import_obsidian10.Notice(`Refresh Trip failed: ${e.message}`, 8e3);
  }
}
var TripPicker = class extends import_obsidian10.FuzzySuggestModal {
  constructor(plugin, items, chosen) {
    super(plugin.app);
    this.items = items;
    this.chosen = chosen;
    this.setPlaceholder("Add to which trip?");
  }
  items;
  chosen;
  getItems() {
    return this.items;
  }
  getItemText(n) {
    return `${n.name} \xB7 ${dayKey(n.fm.Start) ?? "dates TBC"}`;
  }
  onChooseItem(n) {
    this.chosen(n);
  }
};
var GROUP_GUESS = { Stay: "Stay", Food: "Meal", Cafe: "Meal", Bar: "Meal", Pub: "Meal" };
function addToTrip(plugin) {
  const app = plugin.app, active = app.workspace.getActiveFile(), kind = typeOf(plugin, active);
  if (!active || !["Place", "Locale", "Trip"].includes(kind)) {
    new import_obsidian10.Notice("Open a place, city or trip note first");
    return;
  }
  const vault = quiet(plugin), here = toNote(vault, active);
  const initial = {};
  if (kind === "Place") {
    initial.Subtype = GROUP_GUESS[here.fm.Group] ?? "Activity";
    initial.Place = `[[${here.name}]]`;
    const locale = follow(vault, here.fm.Locale, here.path);
    if (locale) initial.Locale = `[[${locale.name}]]`;
  } else if (kind === "Locale") {
    initial.Subtype = "Stay";
    initial.Locale = `[[${here.name}]]`;
  } else initial.Subtype = "Activity";
  const open = (trip) => new ItineraryModal(plugin, { trip: trip.file, initial }).open();
  if (kind === "Trip") {
    open(here);
    return;
  }
  const today = todayKey();
  const upcoming = trips(vault, plugin.settings).filter((t) => !t.fm.Cancelled && (!dayKey(t.fm.End) || dayKey(t.fm.End) >= today)).sort((a, b) => (dayKey(a.fm.Start) ?? "9999").localeCompare(dayKey(b.fm.Start) ?? "9999"));
  if (!upcoming.length) {
    new import_obsidian10.Notice("No upcoming trips. Create one with New Trip first");
    return;
  }
  new TripPicker(plugin, upcoming, open).open();
}

// plugins/travel/src/commands/locations.ts
var import_obsidian12 = require("obsidian");

// plugins/travel/src/ui.ts
var import_obsidian11 = require("obsidian");
function ask(app, title, opts = {}) {
  return new Promise((resolve) => {
    let value = opts.value ?? "", done = false;
    const m = new class extends import_obsidian11.Modal {
      onOpen() {
        this.setTitle(title);
        const submit = () => {
          done = true;
          this.close();
          resolve(value.trim());
        };
        new import_obsidian11.Setting(this.contentEl).setName(opts.label ?? "").addText((t) => {
          t.setValue(value).setPlaceholder(opts.placeholder ?? "").onChange((v) => value = v);
          t.inputEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          });
          window.setTimeout(() => {
            t.inputEl.focus();
            t.inputEl.select();
          }, 0);
        });
        new import_obsidian11.Setting(this.contentEl).addButton((b) => b.setButtonText(opts.button ?? "OK").setCta().onClick(submit));
      }
      onClose() {
        this.contentEl.empty();
        if (!done) resolve(null);
      }
    }(app);
    m.open();
  });
}

// plugins/travel/src/commands/locations.ts
var UA = { "User-Agent": "ObsidianTravelVault/0.2 (personal vault)" };
var cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
var fmOf = (plugin, f) => f ? plugin.app.metadataCache.getFileCache(f)?.frontmatter ?? {} : {};
var notesOfType = (plugin, folder, type) => plugin.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith(folder + "/") && fmOf(plugin, f).Type === type);
async function writeNote(plugin, path, existing, text) {
  if (existing) await plugin.app.vault.modify(existing, text);
  else {
    await ensureFolder(plugin.app, path.slice(0, path.lastIndexOf("/")));
    await plugin.app.vault.create(path, text);
  }
}
async function wikipedia(query, search) {
  let title = query;
  if (search) {
    const ws = await requestJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=${encodeURIComponent(query)}`, { headers: UA });
    title = ws.json?.query?.search?.[0]?.title;
    if (!title) return { extract: "", url: "", wikidata: "", coords: null };
  }
  const w = (await requestJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, { headers: UA })).json ?? {};
  return { extract: String(w.extract ?? "").replace(/\n/g, " "), url: w.content_urls?.desktop?.page ?? "", wikidata: w.wikibase_item ?? "", coords: w.coordinates ?? null };
}
async function buildCountry(plugin) {
  const app = plugin.app, s = plugin.settings;
  const active = app.workspace.getActiveFile();
  const openCode = fmOf(plugin, active).Type === "Country" ? String(fmOf(plugin, active)["Country Code"] ?? "") : "";
  const input = await ask(app, "New / Refresh Country", { label: "Country code (ISO alpha-2)", value: openCode || "", placeholder: "JP", button: "Build" });
  if (!input) return;
  const code = input.toUpperCase();
  const notice = new import_obsidian12.Notice(`Building ${code}\u2026`, 0);
  try {
    const key = secret(app, s.restCountriesSecret);
    if (!key) throw new Error(`No REST Countries key. Add a "${s.restCountriesSecret}" secret in Settings \u2192 Keychain.`);
    const rc = await requestJson(`https://api.restcountries.com/countries/v5/codes.alpha_2/${code}`, { headers: { Authorization: `Bearer ${key}` } });
    const c = rc.json?.data?.objects?.[0];
    if (!c) throw new Error(`REST Countries returned nothing for ${code} (HTTP ${rc.status})`);
    const name = c.names.common;
    const native = Object.values(c.names.native ?? {})[0]?.common ?? "";
    const capital = c.capitals?.find((x) => x.attributes?.primary)?.name ?? c.capitals?.[0]?.name ?? "";
    const region = c.subregion ?? c.region ?? "";
    const currencyCodes = (c.currencies ?? []).map((x) => x.code);
    await ensureFolder(app, s.flagsFolder);
    const flag = `${s.flagsFolder}/${code}.svg`;
    if (!await app.vault.adapter.exists(flag) && c.flag?.url_svg) {
      const b = await requestBinary(c.flag.url_svg);
      if (b) await app.vault.adapter.writeBinary(flag, b);
    }
    const hasFlag = await app.vault.adapter.exists(flag);
    notice.setMessage(`Building ${name}: photos\u2026`);
    const dir = `${s.countryImagesFolder}/${code}`;
    const cover = await chooseCover(app, s, { query: name, dir, final: `${dir}/${code}.jpg`, stem: code, title: `Choose a cover for ${name}` });
    notice.setMessage(`Building ${name}: Wikipedia\u2026`);
    const wiki = await wikipedia(name, false);
    let capitalTz = "";
    if (capital) capitalTz = (await placeSearch(app, s, `${capital}, ${name}`, ["timeZone"])).place?.timeZone?.id ?? "";
    const path = `${s.countriesFolder}/${safeName(name)}.md`;
    const existing = app.vault.getAbstractFileByPath(path);
    const capitalNote = capital ? `${capital}, ${name}` : "";
    const values = {
      ...plugin.notes.common(name),
      titleUrl: encodeURIComponent(name),
      capitalLink: capitalNote ? `[[${capitalNote}]]` : "\u2014",
      region: region || "\u2014",
      currency: (c.currencies ?? []).map((x) => `${x.code} \xB7 ${x.name} \xB7 ${x.symbol}`).join(" / ") || "\u2014",
      languages: (c.languages ?? []).map((x) => x.name).join(", ") || "\u2014",
      calling: (c.calling_codes ?? []).map((x) => `+${x}`).join(", ") || "\u2014",
      driving: cap(c.cars?.driving_side) || "\u2014",
      zones: (c.timezones ?? []).join(", ") || "\u2014",
      units: [c.units?.measurement_system, c.units?.temperature_scale].filter(Boolean).map(cap).join(" \xB7 ") || "\u2014",
      names: `${c.names.official}${native ? ` \xB7 ${native}` : ""}`,
      extract: wiki.extract,
      wikiLink: wiki.url ? `[Wikipedia](${wiki.url})` : "",
      centreLat: wiki.coords?.lat ?? 0,
      centreLng: wiki.coords?.lon ?? 0
    };
    const owned = {
      "Country Code": code,
      Region: region,
      "Currency Codes": currencyCodes,
      Capital: capitalNote ? `[[${capitalNote}]]` : null,
      Timezone: capitalTz || null,
      Icon: hasFlag ? `[[${flag}]]` : null,
      "Last Refreshed": todayKey(),
      ...cover ? { Banner: `[[${cover}]]` } : {}
    };
    const text = await plugin.templates.build("Country", values, owned, existing ? fmOf(plugin, existing) : {});
    await writeNote(plugin, path, existing, text);
    notice.hide();
    new import_obsidian12.Notice(`Country note built: ${path}`, 6e3);
  } catch (e) {
    notice.hide();
    console.error("Country build failed", e);
    new import_obsidian12.Notice(`New / Refresh Country failed: ${e.message}`, 8e3);
  }
}
var TYPE_ICONS = { City: "\u{1F3D9}\uFE0F", Region: "\u{1F3DE}\uFE0F", Island: "\u{1F3DD}\uFE0F" };
async function buildCity(plugin) {
  const app = plugin.app, s = plugin.settings;
  const active = app.workspace.getActiveFile();
  const openStub = active && fmOf(plugin, active).Type === "Locale" ? active : null;
  const input = await ask(app, "New / Refresh City or Region", { label: "City or region", value: openStub?.basename ?? "", placeholder: "Kyoto, Japan", button: "Build" });
  if (!input) return;
  const notice = new import_obsidian12.Notice(`Building ${input}\u2026`, 0);
  try {
    const stub = notesOfType(plugin, s.localesFolder, "Locale").find((f) => f.basename.toLowerCase() === input.toLowerCase()) ?? null;
    googleKey(app, s);
    const { place: g, status: status2 } = await placeSearch(app, s, input, ["id", "displayName", "types", "location", "timeZone", "addressComponents", "photos"]);
    if (!g) throw new Error(`Google found nothing for "${input}" (HTTP ${status2})`);
    const comp = (type) => (g.addressComponents ?? []).find((c) => c.types?.includes(type));
    const cc = comp("country")?.shortText ?? "";
    const state = comp("administrative_area_level_1")?.longText ?? "";
    const city = g.displayName?.text ?? input.split(",")[0].trim();
    const types = g.types ?? [];
    const lat = g.location?.latitude, lng = g.location?.longitude;
    const norm = (x) => (x ?? "").toLowerCase().replace(/\b(city|prefecture|metropolis|state)\b/g, "").replace(/[^a-z]/g, "");
    const sameAsParent = [state, comp("country")?.longText].some((n) => n && norm(n) === norm(city));
    const guessed = sameAsParent || ["locality", "colloquial_area", "postal_town", "administrative_area_level_3", "sublocality"].some((t) => types.includes(t)) ? "City" : types.includes("natural_feature") && /\b(island|isle|islands)\b/i.test(city) || types.includes("archipelago") ? "Island" : "Region";
    const countryFile = notesOfType(plugin, s.countriesFolder, "Country").find((f) => fmOf(plugin, f)["Country Code"] === cc) ?? null;
    const countryName = countryFile?.basename ?? comp("country")?.longText ?? "";
    if (!countryFile) new import_obsidian12.Notice(`No country note for ${cc || "this country"} yet. Run New / Refresh Country for it.`, 8e3);
    const noteName = stub?.basename ?? safeName(`${city}, ${countryName}`);
    const path = stub?.path ?? `${s.localesFolder}/${noteName}.md`;
    const existing = stub ?? app.vault.getAbstractFileByPath(path);
    const old = existing ? fmOf(plugin, existing) : {};
    const placeName = noteName.replace(/,[^,]*$/, "");
    notice.setMessage(`Building ${placeName}: photos\u2026`);
    const dir = `${s.localeImagesFolder}/${noteName}`;
    const cover = await chooseCover(app, s, { query: input, dir, final: `${dir}/${noteName}.jpg`, stem: noteName, title: `Choose a cover for ${placeName}`, photos: (g.photos ?? []).slice(0, s.coverCandidates) });
    notice.setMessage(`Building ${placeName}: Wikipedia\u2026`);
    const wiki = await wikipedia(`${city} ${countryName}`, true);
    let population = "";
    if (wiki.wikidata) {
      const wd = (await requestJson(`https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P1082&entity=${wiki.wikidata}`, { headers: UA })).json;
      const when = (c) => c.qualifiers?.P585?.[0]?.datavalue?.value?.time ?? "";
      const best = [...wd?.claims?.P1082 ?? []].filter((c) => c.rank !== "deprecated").sort((a, b) => when(b).localeCompare(when(a)))[0];
      const n = Number(best?.mainsnak?.datavalue?.value?.amount);
      if (Number.isFinite(n)) {
        const yr = when(best).slice(1, 5);
        population = `${n.toLocaleString("en-AU")}${yr ? ` (${yr})` : ""}`;
      }
    }
    const localeType = String(old["Locale Type"] || guessed);
    const values = {
      ...plugin.notes.common(noteName),
      countryLink: countryName ? `[[${countryName}]]` : "\u2014",
      state: state || "\u2014",
      population: population || "\u2014",
      extract: wiki.extract,
      wikiLink: wiki.url ? `[Wikipedia](${wiki.url})` : "",
      lat: lat ?? 0,
      lng: lng ?? 0
    };
    const owned = {
      Country: countryName ? `[[${countryName}]]` : null,
      Region: state || null,
      ...old["Locale Type"] ? {} : { "Locale Type": localeType },
      Icon: TYPE_ICONS[localeType] ?? null,
      Coordinates: lat !== void 0 && lng !== void 0 ? `${lat},${lng}` : null,
      Timezone: g.timeZone?.id ?? null,
      ...old.Safety === void 0 && old["Areas to Avoid"] ? { Safety: old["Areas to Avoid"] } : {},
      "Last Refreshed": todayKey(),
      ...cover ? { Banner: `[[${cover}]]` } : {}
    };
    const text = await plugin.templates.build("City", values, owned, old);
    await writeNote(plugin, path, existing, text);
    notice.hide();
    new import_obsidian12.Notice(`City note built: ${path}`, 6e3);
  } catch (e) {
    notice.hide();
    console.error("City build failed", e);
    new import_obsidian12.Notice(`New / Refresh City or Region failed: ${e.message}`, 8e3);
  }
}

// plugins/travel/src/bases.ts
var import_obsidian13 = require("obsidian");
var LIST_VIEW = "travel-list";
var TravelListView = class extends import_obsidian13.BasesView {
  constructor(controller, parentEl, plugin) {
    super(controller);
    this.plugin = plugin;
    this.root = parentEl.createDiv({ cls: "travel-bases-list" });
  }
  plugin;
  type = LIST_VIEW;
  root;
  onDataUpdated() {
    const root = this.root, app = this.plugin.app;
    root.empty();
    const vault = this.plugin.index.scope(new Deps(() => {
    }));
    const t = textWriter(app, "");
    const itin = new ItinTools(vault, this.plugin.settings.icons, t, (n) => editItinerary(this.plugin, n.file));
    const heading3 = String(this.config.get("heading") ?? "");
    const tick = this.config.get("tick") === true || this.config.get("tick") === "true";
    if (heading3) root.createEl("strong", { cls: "travel-heading", text: heading3 });
    const today = todayKey();
    let count = 0;
    for (const group of this.data.groupedData) {
      const list = group.hasKey() ? root.createDiv({ cls: "travel-bases-group" }) : root;
      if (group.hasKey()) list.createEl("strong", { cls: "travel-bases-group-key", text: group.key?.toString() ?? "" });
      for (const entry of group.entries) {
        count++;
        const n = toNote(vault, entry.file);
        if (n.fm.Type === "Itinerary") {
          const when = dayKey(n.fm.Start) ? fmt(n.fm.Start, "ccc d LLL") + (timeOf(n.fm.Start) ? ` \xB7 ${timeOf(n.fm.Start)}` : "") : "Idea";
          itin.line(list, n, when);
        } else if (n.fm.Type === "Place") {
          const row = list.createEl(tick ? "label" : "div", { cls: tick ? "travel-todo-row" : "travel-bases-row" });
          if (tick) {
            const box = row.createEl("input", { type: "checkbox" });
            box.addEventListener("change", async () => {
              if (!box.checked) return;
              await app.fileManager.processFrontMatter(n.file, (fm) => {
                fm.Visited = true;
                fm["Last Visited"] = todayKey();
              });
            });
          }
          t.span(row, `${itin.placeIcon(n) ?? this.plugin.settings.icons.default} ${linkTo(n.path)}${n.fm.Rating ? ` <small>\u2605 ${n.fm.Rating}</small>` : ""}`);
        } else if (n.fm.Type === "Trip") {
          const s = dayKey(n.fm.Start), e = dayKey(n.fm.End);
          t.div(list, `${linkTo(n.path)} \xB7 ${s ? `${fmt(s, "d LLL yyyy")}${e ? " \u2013 " + fmt(e, "d LLL yyyy") : ""}` : "dates TBC"} \xB7 ${tripStatus(n, today)}`);
        } else t.div(list, linkTo(n.path));
      }
    }
    if (!count) root.createDiv({ cls: "travel-muted", text: "Nothing here yet" });
  }
};
function registerBasesViews(plugin) {
  if (typeof plugin.registerBasesView !== "function") return;
  plugin.registerBasesView(LIST_VIEW, {
    name: "Travel List",
    icon: "list",
    factory: (controller, el) => new TravelListView(controller, el, plugin),
    options: () => [{ type: "text", displayName: "Heading", key: "heading", default: "" }]
  });
}

// plugins/travel/src/main.ts
var Travel = class extends import_obsidian14.Plugin {
  settings = structuredClone(DEFAULT_SETTINGS);
  index;
  engine;
  notes = new NoteMaker(this);
  templates = new Templates(this);
  core = null;
  async onload() {
    const saved = await this.loadData() ?? {};
    this.settings = { ...structuredClone(DEFAULT_SETTINGS), ...saved, icons: { ...DEFAULT_ICONS, ...saved.icons ?? {} } };
    this.index = new VaultIndex(this.app);
    this.engine = new BlockEngine(this, this.index, {
      language: "travel",
      widgets: WIDGETS,
      extend: (base) => travelContext(this, base)
    });
    this.engine.start();
    this.addSettingTab(new TravelSettingTab(this.app, this));
    registerBasesViews(this);
    this.addCommand({ id: "new-trip", name: "New trip", callback: () => newTrip(this) });
    this.addCommand({ id: "add-to-trip", name: "Add to trip", callback: () => addToTrip(this) });
    this.addCommand({ id: "refresh-trip", name: "Refresh trip", callback: () => void refreshTrip(this) });
    this.addCommand({ id: "build-country", name: "New / refresh country", callback: () => void buildCountry(this) });
    this.addCommand({ id: "build-city", name: "New / refresh city or region", callback: () => void buildCity(this) });
    this.addCommand({
      id: "edit-itinerary-item",
      name: "Edit itinerary item",
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || this.app.metadataCache.getFileCache(f)?.frontmatter?.Type !== "Itinerary") return false;
        if (!checking) editItinerary(this, f);
        return true;
      }
    });
    this.app.workspace.onLayoutReady(async () => {
      this.index.watch(this);
      if (!this.settings.configImported) await this.importConfig();
      const core = getCore(this.app);
      if (core) this.registerWithCore(core);
    });
  }
  onunload() {
    this.core?.unregisterNav("travel");
    this.core?.unregisterEngine(this.engine);
  }
  /** Called by Vault Core too, if it loads after this plugin. Safe to call twice. */
  registerWithCore(api) {
    this.core = api;
    api.registerNav({ id: "travel", root: () => this.settings.moduleRoot, rules: (vault, file) => travelNav(vault, file, this.settings) });
    api.registerEngine(this.engine);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.engine.refreshAll();
    this.core?.refreshNav();
  }
  /** One-off: take over the values in the old _config.md note. */
  async importConfig() {
    const n = importOldConfig(this.app, this.settings);
    this.settings.configImported = true;
    await this.saveData(this.settings);
    if (n) new import_obsidian14.Notice(`Travel: imported ${n} settings from ${OLD_CONFIG}. They're in Settings \u2192 Travel now; the note can be deleted.`, 1e4);
  }
};
