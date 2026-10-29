/* Vault Core 0.1.0 — built from obsidian-vault-plugins; edit the source, not this file */
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

// plugins/vault-core/src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => VaultCore
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

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
var folderLabel = (path) => path.split("/").pop().replace(/\.md$/, "").replace(/^\d+\s*-\s*/, "");
var folderNote = (folder) => `${folder}/${folder.split("/").pop()}.md`;

// plugins/vault-core/src/nav.ts
function folderCrumbs(ctx, from, to) {
  const parts = to.split("/").filter(Boolean);
  const start = from ? from.split("/").filter(Boolean).length : 0;
  const out = [];
  for (let i = start; i < parts.length; i++) {
    const folder = parts.slice(0, i + 1).join("/");
    const note = folderNote(folder);
    out.push({ path: ctx.vault.file(note) ? note : null, label: folderLabel(folder) });
  }
  return out;
}
function nav(ctx) {
  ctx.vault.deps.add("nav:modules");
  const file = ctx.vault.file(ctx.sourcePath);
  if (!file) return;
  const here = file.path, home = ctx.home();
  const parent = here.includes("/") ? here.slice(0, here.lastIndexOf("/")) : "";
  const mod = ctx.modules().find((m) => {
    const r = m.root();
    return r && here.startsWith(r + "/");
  });
  let crumbs = here === home ? [] : [{ path: ctx.vault.file(home) ? home : null, label: "Home" }];
  let current = here === folderNote(parent) ? folderLabel(parent) : file.basename;
  let result = null;
  if (mod) {
    const root = mod.root();
    crumbs.push(...folderCrumbs(ctx, "", root));
    try {
      result = mod.rules(ctx.vault, file);
    } catch (e) {
      console.error(`nav: ${mod.id} rules failed`, e);
    }
    crumbs.push(...result?.crumbs ?? folderCrumbs(ctx, root, parent));
    if (result?.current) current = result.current;
  } else if (here !== home) crumbs.push(...folderCrumbs(ctx, "", parent));
  crumbs = crumbs.filter((c) => c.path !== here);
  const link = (c) => c.path ? `[[${c.path}|${c.label}]]` : c.label;
  const bar = ctx.el.createDiv({ cls: "vault-nav" });
  const line1 = bar.createDiv({ cls: "vault-nav-line" });
  const trail = line1.createDiv({ cls: "vault-nav-crumbs" });
  ctx.t.span(trail, crumbs.map(link).join(" \u203A ") + (crumbs.length ? " \u203A " : ""));
  trail.createSpan({ cls: "vault-nav-current", text: current });
  if (result?.right) ctx.t.span(line1.createDiv({ cls: "vault-nav-right" }), result.right);
  if (result?.prev || result?.next) {
    const line2 = bar.createDiv({ cls: "vault-nav-line" });
    ctx.t.span(line2.createDiv({ cls: "vault-nav-prev" }), result.prev ? `\u2190 ${result.prev}` : "");
    ctx.t.span(line2.createDiv({ cls: "vault-nav-next" }), result.next ? `${result.next} \u2192` : "");
  }
}

// plugins/vault-core/src/main.ts
var DEFAULTS = { homeNote: "Home.md" };
var VaultCore = class extends import_obsidian2.Plugin {
  settings = { ...DEFAULTS };
  modules = /* @__PURE__ */ new Map();
  engines = /* @__PURE__ */ new Set();
  index;
  engine;
  api = {
    registerNav: (m) => {
      this.modules.set(m.id, m);
      this.refreshNav();
    },
    unregisterNav: (id) => {
      if (this.modules.delete(id)) this.refreshNav();
    },
    registerEngine: (e) => {
      this.engines.add(e);
    },
    unregisterEngine: (e) => {
      this.engines.delete(e);
    },
    refreshNav: () => this.refreshNav()
  };
  async onload() {
    this.settings = { ...DEFAULTS, ...await this.loadData() ?? {} };
    this.index = new VaultIndex(this.app);
    this.engine = new BlockEngine(this, this.index, {
      language: "nav",
      defaultWidget: "nav",
      widgets: { nav },
      extend: (base) => ({ ...base, modules: () => [...this.modules.values()], home: () => this.settings.homeNote })
    });
    this.engine.start();
    this.engines.add(this.engine);
    this.addSettingTab(new CoreSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      this.index.watch(this);
      const plugins = this.app.plugins.plugins;
      for (const p of Object.values(plugins)) p.registerWithCore?.(this.api);
    });
    this.addCommand({ id: "show-timings", name: "Show render timings", callback: () => this.showTimings() });
    this.addCommand({ id: "benchmark-note", name: "Benchmark this note", callback: () => void this.benchmark() });
    this.addCommand({ id: "refresh-views", name: "Refresh all views", callback: () => {
      for (const e of this.engines) e.refreshAll();
    } });
  }
  refreshNav() {
    this.engine?.invalidate(["nav:modules"]);
  }
  showTimings() {
    const rows = [...this.engines].flatMap((e) => [...e.timings.entries()]).sort((a, b) => b[1] - a[1]);
    console.table(rows.map(([block, ms]) => ({ block, ms: Math.round(ms * 10) / 10 })));
    new import_obsidian2.Notice(`Render timings for ${rows.length} blocks are in the developer console (Ctrl+Shift+I). These include waiting while the rest of the note loads; use "Benchmark this note" for each block's own cost.`, 8e3);
  }
  async benchmark() {
    const path = this.app.workspace.getActiveFile()?.path;
    if (!path) return;
    const rows = [];
    for (const e of this.engines) rows.push(...await e.benchmark(path));
    if (!rows.length) {
      new import_obsidian2.Notice("No blocks on this note");
      return;
    }
    const r1 = (n) => Math.round(n * 10) / 10;
    console.table(rows.map((r) => ({ block: r.block, cold: r1(r.cold), warm: r1(r.warm) })));
    const sum = (k) => Math.round(rows.reduce((n, r) => n + r[k], 0));
    new import_obsidian2.Notice(`Benchmark (${this.app.vault.getMarkdownFiles().length} notes): ${rows.length} blocks, cold ${sum("cold")} ms, warm ${sum("warm")} ms. Each block timed alone; details in the console.`, 1e4);
  }
};
var CoreSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  plugin;
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName("Home note").setDesc("The first crumb of every nav bar.").addText((t) => t.setValue(this.plugin.settings.homeNote).onChange(async (v) => {
      this.plugin.settings.homeNote = v.trim() || DEFAULTS.homeNote;
      await this.plugin.saveData(this.plugin.settings);
      this.plugin.api.refreshNav();
    }));
  }
};
