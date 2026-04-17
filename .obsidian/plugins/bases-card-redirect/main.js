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

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BasesCardRedirect
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// src/settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  redirectCssClass: "card-redirect",
  redirectFolders: [],
  sourceProperty: "link",
  rules: [
    { matchProperty: "Kind", matchValue: "Stay", targetProperty: "Country" }
  ]
};
var BasesCardRedirectSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Redirect cssclass").setDesc("Only redirect clicks in base views where the containing note has this cssclass. Leave blank to apply to all notes assuming other criteria are met.").addText(
      (t) => t.setPlaceholder("CSS class").setValue(this.plugin.settings.redirectCssClass).onChange(async (v) => {
        this.plugin.settings.redirectCssClass = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Redirect folders").setDesc("Only redirect clicks in base views where the containing note is within these folders or their subfolders. Leave blank to apply to all notes assuming other criteria are met.");
    this.plugin.settings.redirectFolders.forEach((folder, idx) => {
      new import_obsidian.Setting(containerEl).addText((t) => {
        t.setPlaceholder("Folder path").setValue(folder).onChange(async (v) => {
          const trimmed = v.trim();
          const valid = trimmed === "" || !!this.plugin.app.vault.getFolderByPath(trimmed);
          t.inputEl.style.borderColor = valid ? "" : "red";
          if (valid) {
            this.plugin.settings.redirectFolders[idx] = trimmed;
            await this.plugin.saveSettings();
          }
        });
        t.inputEl.setCssProps({
          "width": "100%"
        });
        return t;
      }).addExtraButton(
        (b) => b.setIcon("trash").setTooltip("Remove folder").onClick(async () => {
          this.plugin.settings.redirectFolders.splice(idx, 1);
          await this.plugin.saveSettings();
          this.display();
        })
      );
    });
    new import_obsidian.Setting(containerEl).addButton(
      (b) => b.setButtonText("Add folder").onClick(async () => {
        this.plugin.settings.redirectFolders.push("");
        await this.plugin.saveSettings();
        this.display();
      })
    );
    containerEl.createEl("hr");
    new import_obsidian.Setting(containerEl).setName("Source property").setDesc("The formula column name in the base card that contains the link to the source note.").addText(
      (t) => t.setPlaceholder("Link property").setValue(this.plugin.settings.sourceProperty).onChange(async (v) => {
        this.plugin.settings.sourceProperty = v.trim();
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("hr");
    new import_obsidian.Setting(containerEl).setName("Mapping rules").setDesc("First match wins. Use the up/down arrows to reorder rules.");
    this.plugin.settings.rules.forEach((rule, idx) => {
      const setting = new import_obsidian.Setting(containerEl);
      containerEl.setCssProps({
        "width": "100%",
        "flexWrap": "nowrap"
      });
      setting.addText((t) => {
        t.setPlaceholder("Match property").setValue(rule.matchProperty).onChange(async (v) => {
          rule.matchProperty = v.trim();
          await this.plugin.saveSettings();
        });
        t.inputEl.setCssProps({
          "width": "100%"
        });
        return t;
      });
      setting.addText((t) => {
        t.setPlaceholder("Match value").setValue(rule.matchValue).onChange(async (v) => {
          rule.matchValue = v;
          await this.plugin.saveSettings();
        });
        t.inputEl.setCssProps({
          "width": "100%"
        });
        return t;
      });
      setting.addText((t) => {
        t.setPlaceholder("Target property").setValue(rule.targetProperty).onChange(async (v) => {
          rule.targetProperty = v.trim();
          await this.plugin.saveSettings();
        });
        t.inputEl.setCssProps({
          "width": "100%"
        });
        return t;
      });
      setting.addExtraButton(
        (b) => b.setIcon("arrow-up").setTooltip("Move up").setDisabled(idx === 0).onClick(async () => {
          if (idx <= 0) return;
          const rules = this.plugin.settings.rules;
          [rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
          await this.plugin.saveSettings();
          this.display();
        })
      );
      setting.addExtraButton(
        (b) => b.setIcon("arrow-down").setTooltip("Move down").setDisabled(idx === this.plugin.settings.rules.length - 1).onClick(async () => {
          const rules = this.plugin.settings.rules;
          if (idx >= rules.length - 1) return;
          [rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
          await this.plugin.saveSettings();
          this.display();
        })
      );
      setting.addExtraButton(
        (b) => b.setIcon("trash").setTooltip("Remove rule").onClick(async () => {
          this.plugin.settings.rules.splice(idx, 1);
          await this.plugin.saveSettings();
          this.display();
        })
      );
    });
    new import_obsidian.Setting(containerEl).addButton(
      (b) => b.setButtonText("Add rule").onClick(async () => {
        this.plugin.settings.rules.push({
          matchProperty: "",
          matchValue: "",
          targetProperty: ""
        });
        await this.plugin.saveSettings();
        this.display();
      })
    );
  }
};

// src/main.ts
var BasesCardRedirect = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    // ------------------------
    // Click handler (capture)
    // ------------------------
    this.onClickCapture = (evt) => {
      void this.handleClick(evt);
    };
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new BasesCardRedirectSettingTab(this.app, this));
    document.addEventListener("click", this.onClickCapture, true);
    document.addEventListener("auxclick", this.onClickCapture, true);
  }
  onunload() {
    document.removeEventListener("click", this.onClickCapture, true);
    document.removeEventListener("auxclick", this.onClickCapture, true);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async handleClick(evt) {
    try {
      if (evt.button !== 0 && evt.button !== 1) return;
      const targetEl = evt.target;
      if (!targetEl) return;
      if (this.isInteractive(targetEl)) return;
      const cardEl = this.findCardEl(targetEl);
      if (!cardEl) return;
      if (!this.isWithinRedirectClass(cardEl)) return;
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile) return;
      const activeFolder = activeFile.parent;
      if (!activeFolder) return;
      if (!this.isWithinRedirectFolder(activeFolder)) return;
      const cardFile = this.findCardFile(cardEl);
      if (!cardFile) return;
      const targetFile = this.resolveTargetFile(cardFile);
      if (!targetFile) return;
      evt.preventDefault();
      evt.stopImmediatePropagation();
      const mode = this.getLeafMode(evt);
      await this.openFile(targetFile, mode);
    } catch {
    }
  }
  // ------------------------
  // Element class filters
  // ------------------------
  isInteractive(el) {
    return !!el.closest(".internal-link");
  }
  findCardEl(from) {
    const found = from.closest(".bases-cards-item");
    if (found) return found;
    return null;
  }
  isWithinRedirectClass(el) {
    if (!this.settings.redirectCssClass) return true;
    return !!el.closest("." + this.settings.redirectCssClass);
  }
  // ------------------------
  // Redirect folder filter
  // ------------------------
  isWithinRedirectFolder(folder) {
    if (!this.settings.redirectFolders.length) return true;
    return this.settings.redirectFolders.some(
      (f) => folder.path === f || folder.path.startsWith(f + "/")
    );
  }
  // ------------------------
  // Card note detection
  // ------------------------
  findCardFile(cardEl) {
    const source = (this.settings.sourceProperty ?? "").trim();
    if (!source) return null;
    const keys = source.includes(".") ? [source] : [`formula.${source}`, source];
    for (const key of keys) {
      const propEl = cardEl.querySelector(
        `.bases-cards-property[data-property="${CSS.escape(key)}"]`
      );
      if (!propEl) continue;
      const href = propEl.querySelector(".bases-cards-line .internal-link[data-href]")?.getAttribute("data-href")?.trim();
      if (!href) return null;
      const file = this.app.vault.getAbstractFileByPath(href);
      return file instanceof import_obsidian2.TFile ? file : null;
    }
    return null;
  }
  // ------------------------
  // Rule + target resolution
  // ------------------------
  resolveTargetFile(sourceFile) {
    const fm = this.app.metadataCache.getFileCache(sourceFile)?.frontmatter;
    if (!fm) return null;
    for (const rule of this.settings.rules) {
      const v = fm[rule.matchProperty];
      if (!this.fmEquals(v, rule.matchValue)) continue;
      const targetVal = fm[rule.targetProperty];
      const targetFile = this.resolveLinkToFile(targetVal);
      if (targetFile) return targetFile;
      return null;
    }
    return null;
  }
  fmEquals(value, expected) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.some((x) => this.fmEquals(x, expected));
    if (typeof value === "object") return false;
    return String(value) === expected;
  }
  resolveLinkToFile(link) {
    if (typeof link !== "string") return null;
    const m = link.trim().match(/^\[\[([\s\S]+?)\]\]$/);
    if (!m) return null;
    const target = m[1].split("|")[0].trim();
    if (!target) return null;
    const filename = target.toLowerCase().endsWith(".md") ? target : `${target}.md`;
    const file = this.app.metadataCache.getFirstLinkpathDest(filename, "");
    return file instanceof import_obsidian2.TFile ? file : null;
  }
  // ------------------------
  // Open behaviour (preserve semantics, apply to redirected target)
  // ------------------------
  getLeafMode(evt) {
    const isMiddle = evt.button === 1;
    const isCmdCtrl = evt.ctrlKey || evt.metaKey;
    const isAlt = evt.altKey;
    if (isCmdCtrl && isAlt) return "split";
    if (isCmdCtrl || isMiddle) return "tab";
    return false;
  }
  async openFile(file, mode) {
    const leaf = this.app.workspace.getLeaf(mode || false);
    await leaf.openFile(file, { active: true });
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vUHJvamVjdHMvYmFzZXMtY2FyZC1yZWRpcmVjdC9zcmMvbWFpbi50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi9Qcm9qZWN0cy9iYXNlcy1jYXJkLXJlZGlyZWN0L3NyYy9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcclxuICAgIFBsdWdpbixcclxuICAgIFRGaWxlLFxyXG4gICAgVEZvbGRlcixcclxuICAgIFdvcmtzcGFjZUxlYWZcclxufSBmcm9tIFwib2JzaWRpYW5cIjtcclxuaW1wb3J0IHtcclxuICAgIERFRkFVTFRfU0VUVElOR1MsXHJcbiAgICBCYXNlc0NhcmRSZWRpcmVjdFNldHRpbmdzLFxyXG4gICAgQmFzZXNDYXJkUmVkaXJlY3RTZXR0aW5nVGFiXHJcbn0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcclxuXHJcbnR5cGUgTmV3TGVhZk1vZGUgPSBmYWxzZSB8IFwidGFiXCIgfCBcInNwbGl0XCI7XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gUGx1Z2luIGNsYXNzXHJcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCYXNlc0NhcmRSZWRpcmVjdCBleHRlbmRzIFBsdWdpbiB7XHJcbiAgICBzZXR0aW5ncyE6IEJhc2VzQ2FyZFJlZGlyZWN0U2V0dGluZ3M7XHJcblxyXG4gICAgYXN5bmMgb25sb2FkKCkge1xyXG4gICAgICAgIC8vIExvYWQgc2V0dGluZ3MgYW5kIHNldHRpbmdzIHRhYlxyXG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XHJcbiAgICAgICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBCYXNlc0NhcmRSZWRpcmVjdFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcclxuXHJcbiAgICAgICAgLy8gQ2FwdHVyZSBzbyB3ZSBjYW4gc3RvcCBCYXNlcyBiZWZvcmUgaXQgb3BlbnMgdGhlIGNhcmQgZmlsZS5cclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5vbkNsaWNrQ2FwdHVyZSwgdHJ1ZSk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImF1eGNsaWNrXCIsIHRoaXMub25DbGlja0NhcHR1cmUsIHRydWUpO1xyXG4gICAgfVxyXG5cclxuICAgIG9udW5sb2FkKCkge1xyXG4gICAgICAgIC8vIENsZWFuIHVwXHJcbiAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMub25DbGlja0NhcHR1cmUsIHRydWUpO1xyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJhdXhjbGlja1wiLCB0aGlzLm9uQ2xpY2tDYXB0dXJlLCB0cnVlKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBDbGljayBoYW5kbGVyIChjYXB0dXJlKVxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBwcml2YXRlIG9uQ2xpY2tDYXB0dXJlID0gKGV2dDogTW91c2VFdmVudCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHZvaWQgdGhpcy5oYW5kbGVDbGljayhldnQpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgaGFuZGxlQ2xpY2soZXZ0OiBNb3VzZUV2ZW50KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgLy8gT25seSBsZWZ0IGFuZCBtaWRkbGUgY2xpY2tcclxuICAgICAgICAgICAgaWYgKGV2dC5idXR0b24gIT09IDAgJiYgZXZ0LmJ1dHRvbiAhPT0gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0RWwgPSBldnQudGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRFbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgLy8gRG8gTk9UIGhpamFjayBjbGlja3Mgb24gbGlua3MvYnV0dG9ucy9pbnB1dHMgaW5zaWRlIHRoZSBjYXJkLlxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0ludGVyYWN0aXZlKHRhcmdldEVsKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgLy9Pbmx5IG92ZXJyaWRlIHdpdGhpbiBjYXJkIGl0ZW1zXHJcbiAgICAgICAgICAgIGNvbnN0IGNhcmRFbCA9IHRoaXMuZmluZENhcmRFbCh0YXJnZXRFbCk7XHJcbiAgICAgICAgICAgIGlmICghY2FyZEVsKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAvLyBPbmx5IG92ZXJyaWRlIGluIG5vdGVzIHdpdGggdGhlIHJlZGlyZWN0IENTUyBjbGFzcyAoaWYgZGVmaW5lZClcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzV2l0aGluUmVkaXJlY3RDbGFzcyhjYXJkRWwpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAvLyBPbmx5IG92ZXJyaWRlIGluIG5vdGVzIHdpdGhpbiBkZWZpbmVkIGZvbGRlcnMgKGlmIGFueSlcclxuICAgICAgICAgICAgY29uc3QgYWN0aXZlRmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XHJcbiAgICAgICAgICAgIGlmICghYWN0aXZlRmlsZSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgYWN0aXZlRm9sZGVyID0gYWN0aXZlRmlsZS5wYXJlbnQ7XHJcbiAgICAgICAgICAgIGlmICghYWN0aXZlRm9sZGVyKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNXaXRoaW5SZWRpcmVjdEZvbGRlcihhY3RpdmVGb2xkZXIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAvLyBJZGVudGlmeSB0aGUgbm90ZSB0aGUgY2FyZCByZXByZXNlbnRzXHJcbiAgICAgICAgICAgIGNvbnN0IGNhcmRGaWxlID0gdGhpcy5maW5kQ2FyZEZpbGUoY2FyZEVsKTtcclxuICAgICAgICAgICAgaWYgKCFjYXJkRmlsZSkgcmV0dXJuO1xyXG4gICAgICBcclxuICAgICAgICAgICAgLy8gQ29tcHV0ZSByZWRpcmVjdCB0YXJnZXQgZnJvbSBmcm9udG1hdHRlciBtYXBwaW5nIHJ1bGVzXHJcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZpbGUgPSB0aGlzLnJlc29sdmVUYXJnZXRGaWxlKGNhcmRGaWxlKTtcclxuICAgICAgICAgICAgaWYgKCF0YXJnZXRGaWxlKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAvLyBTdG9wIGRlZmF1bHQgY2FyZCBjbGljayBvcGVuaW5nIHRoZSByb3cgbm90ZVxyXG4gICAgICAgICAgICBldnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZXZ0LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgbW9kZSA9IHRoaXMuZ2V0TGVhZk1vZGUoZXZ0KTtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy5vcGVuRmlsZSh0YXJnZXRGaWxlLCBtb2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2gge1xyXG4gICAgICAgICAgICAvLyBGYWlsIHNpbGVudGx5OyB3b3JzdCBjYXNlIEJhc2VzIG9wZW5zIHRoZSByb3cgbm90ZSBub3JtYWxseS5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBFbGVtZW50IGNsYXNzIGZpbHRlcnNcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgcHJpdmF0ZSBpc0ludGVyYWN0aXZlKGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiAhIWVsLmNsb3Nlc3QoXCIuaW50ZXJuYWwtbGlua1wiKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZpbmRDYXJkRWwoZnJvbTogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xyXG4gICAgICAgIGNvbnN0IGZvdW5kID0gZnJvbS5jbG9zZXN0KFwiLmJhc2VzLWNhcmRzLWl0ZW1cIik7XHJcbiAgICAgICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQgYXMgSFRNTEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaXNXaXRoaW5SZWRpcmVjdENsYXNzKGVsOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5yZWRpcmVjdENzc0NsYXNzKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICByZXR1cm4gISFlbC5jbG9zZXN0KFwiLlwiICsgdGhpcy5zZXR0aW5ncy5yZWRpcmVjdENzc0NsYXNzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIC8vIFJlZGlyZWN0IGZvbGRlciBmaWx0ZXJcclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgcHJpdmF0ZSBpc1dpdGhpblJlZGlyZWN0Rm9sZGVyKGZvbGRlcjogVEZvbGRlcik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5yZWRpcmVjdEZvbGRlcnMubGVuZ3RoKSByZXR1cm4gdHJ1ZTtcclxuICAgIFxyXG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzLnJlZGlyZWN0Rm9sZGVycy5zb21lKChmKSA9PlxyXG4gICAgICAgICAgICBmb2xkZXIucGF0aCA9PT0gZiB8fCBmb2xkZXIucGF0aC5zdGFydHNXaXRoKGYgKyBcIi9cIilcclxuICAgICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gQ2FyZCBub3RlIGRldGVjdGlvblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICBwcml2YXRlIGZpbmRDYXJkRmlsZShjYXJkRWw6IEhUTUxFbGVtZW50KTogVEZpbGUgfCBudWxsIHtcclxuICAgICAgICBjb25zdCBzb3VyY2UgPSAodGhpcy5zZXR0aW5ncy5zb3VyY2VQcm9wZXJ0eSA/PyBcIlwiKS50cmltKCk7XHJcbiAgICAgICAgaWYgKCFzb3VyY2UpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBjb25zdCBrZXlzID0gc291cmNlLmluY2x1ZGVzKFwiLlwiKSA/IFtzb3VyY2VdIDogW2Bmb3JtdWxhLiR7c291cmNlfWAsIHNvdXJjZV07XHJcblxyXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIGtleXMpIHtcclxuICAgICAgICAgICAgY29uc3QgcHJvcEVsID0gY2FyZEVsLnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxyXG4gICAgICAgICAgICAgICAgYC5iYXNlcy1jYXJkcy1wcm9wZXJ0eVtkYXRhLXByb3BlcnR5PVwiJHtDU1MuZXNjYXBlKGtleSl9XCJdYFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBpZiAoIXByb3BFbCkgY29udGludWU7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb25zdCBocmVmID0gcHJvcEVsXHJcbiAgICAgICAgICAgICAgICAucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIuYmFzZXMtY2FyZHMtbGluZSAuaW50ZXJuYWwtbGlua1tkYXRhLWhyZWZdXCIpXHJcbiAgICAgICAgICAgICAgICA/LmdldEF0dHJpYnV0ZShcImRhdGEtaHJlZlwiKVxyXG4gICAgICAgICAgICAgICAgPy50cmltKCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWhyZWYpIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChocmVmKTtcclxuICAgICAgICAgICAgcmV0dXJuIGZpbGUgaW5zdGFuY2VvZiBURmlsZSA/IGZpbGUgOiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAvLyBSdWxlICsgdGFyZ2V0IHJlc29sdXRpb25cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgcHJpdmF0ZSByZXNvbHZlVGFyZ2V0RmlsZShzb3VyY2VGaWxlOiBURmlsZSk6IFRGaWxlIHwgbnVsbCB7XHJcbiAgICAgICAgY29uc3QgZm0gPSB0aGlzLmFwcC5tZXRhZGF0YUNhY2hlLmdldEZpbGVDYWNoZShzb3VyY2VGaWxlKT8uZnJvbnRtYXR0ZXI7XHJcbiAgICAgICAgaWYgKCFmbSkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIC8vIE9yZGVyZWQgcnVsZXM6IGZpcnN0IG1hdGNoIHdpbnNcclxuICAgICAgICBmb3IgKGNvbnN0IHJ1bGUgb2YgdGhpcy5zZXR0aW5ncy5ydWxlcykge1xyXG4gICAgICAgICAgICBjb25zdCB2ID0gZm1bcnVsZS5tYXRjaFByb3BlcnR5XTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmZtRXF1YWxzKHYsIHJ1bGUubWF0Y2hWYWx1ZSkpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgdGFyZ2V0VmFsID0gZm1bcnVsZS50YXJnZXRQcm9wZXJ0eV07XHJcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldEZpbGUgPSB0aGlzLnJlc29sdmVMaW5rVG9GaWxlKHRhcmdldFZhbCk7XHJcbiAgICAgICAgICAgIGlmICh0YXJnZXRGaWxlKSByZXR1cm4gdGFyZ2V0RmlsZTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hdGNoIGZvdW5kLCBidXQgdGFyZ2V0IG1pc3NpbmcvdW5yZXNvbHZhYmxlIC0+IHN0b3AgaGVyZSB0byBhdm9pZCBzdXJwcmlzaW5nIGZhbGx0aHJvdWdoXHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGZtRXF1YWxzKHZhbHVlOiB1bmtub3duLCBleHBlY3RlZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybiBmYWxzZTtcclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHJldHVybiB2YWx1ZS5zb21lKCh4KSA9PiB0aGlzLmZtRXF1YWxzKHgsIGV4cGVjdGVkKSk7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIikgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiBTdHJpbmcodmFsdWUpID09PSBleHBlY3RlZDtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlc29sdmVMaW5rVG9GaWxlKGxpbms6IHVua25vd24pOiBURmlsZSB8IG51bGwge1xyXG4gICAgICAgIGlmICh0eXBlb2YgbGluayAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIC8vIEV4cGVjdDogXCJbW1RhcmdldF1dXCIgb3IgXCJbW1RhcmdldHxBbGlhc11dXCJcclxuICAgICAgICBjb25zdCBtID0gbGluay50cmltKCkubWF0Y2goL15cXFtcXFsoW1xcc1xcU10rPylcXF1cXF0kLyk7XHJcbiAgICAgICAgaWYgKCFtKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgY29uc3QgdGFyZ2V0ID0gbVsxXS5zcGxpdChcInxcIilbMF0udHJpbSgpOyAvLyBsZWZ0IG9mIHwgKG9yIHdob2xlIHRoaW5nKVxyXG4gICAgICAgIGlmICghdGFyZ2V0KSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgY29uc3QgZmlsZW5hbWUgPSB0YXJnZXQudG9Mb3dlckNhc2UoKS5lbmRzV2l0aChcIi5tZFwiKSA/IHRhcmdldCA6IGAke3RhcmdldH0ubWRgO1xyXG5cclxuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChmaWxlbmFtZSwgXCJcIik7XHJcbiAgICAgICAgcmV0dXJuIGZpbGUgaW5zdGFuY2VvZiBURmlsZSA/IGZpbGUgOiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgLy8gT3BlbiBiZWhhdmlvdXIgKHByZXNlcnZlIHNlbWFudGljcywgYXBwbHkgdG8gcmVkaXJlY3RlZCB0YXJnZXQpXHJcbiAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgIHByaXZhdGUgZ2V0TGVhZk1vZGUoZXZ0OiBNb3VzZUV2ZW50KTogTmV3TGVhZk1vZGUge1xyXG4gICAgICAgIGNvbnN0IGlzTWlkZGxlID0gZXZ0LmJ1dHRvbiA9PT0gMTtcclxuICAgICAgICBjb25zdCBpc0NtZEN0cmwgPSBldnQuY3RybEtleSB8fCBldnQubWV0YUtleTtcclxuICAgICAgICBjb25zdCBpc0FsdCA9IGV2dC5hbHRLZXk7XHJcblxyXG4gICAgICAgIC8vIGN0cmwvY21kICsgYWx0ID0+IHNwbGl0XHJcbiAgICAgICAgaWYgKGlzQ21kQ3RybCAmJiBpc0FsdCkgcmV0dXJuIFwic3BsaXRcIjtcclxuXHJcbiAgICAgICAgLy8gY3RybC9jbWQgb3IgbWlkZGxlID0+IG5ldyB0YWJcclxuICAgICAgICBpZiAoaXNDbWRDdHJsIHx8IGlzTWlkZGxlKSByZXR1cm4gXCJ0YWJcIjtcclxuXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgb3BlbkZpbGUoZmlsZTogVEZpbGUsIG1vZGU6IE5ld0xlYWZNb2RlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgbGVhZjogV29ya3NwYWNlTGVhZiA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKG1vZGUgfHwgZmFsc2UpO1xyXG4gICAgICAgIGF3YWl0IGxlYWYub3BlbkZpbGUoZmlsZSwgeyBhY3RpdmU6IHRydWUgfSk7XHJcbiAgICB9XHJcbn0iLCAiaW1wb3J0IHtcclxuICAgIEFwcCxcclxuICAgIFBsdWdpblNldHRpbmdUYWIsXHJcbiAgICBTZXR0aW5nLFxyXG59IGZyb20gXCJvYnNpZGlhblwiO1xyXG5pbXBvcnQgQmFzZXNDYXJkUmVkaXJlY3QgZnJvbSBcIi4vbWFpblwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBSZWRpcmVjdFJ1bGUge1xyXG4gICAgbWF0Y2hQcm9wZXJ0eTogc3RyaW5nOyAgICAgLy8gZS5nLiBcIktpbmRcIlxyXG4gICAgbWF0Y2hWYWx1ZTogc3RyaW5nOyAgICAgICAgLy8gZS5nLiBcIlN0YXlcIlxyXG4gICAgdGFyZ2V0UHJvcGVydHk6IHN0cmluZzsgICAgLy8gZS5nLiBcIkNvdW50cnlcIlxyXG59O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBCYXNlc0NhcmRSZWRpcmVjdFNldHRpbmdzIHtcclxuICAgIHJlZGlyZWN0Q3NzQ2xhc3M6IHN0cmluZzsgICAgLy8gb25seSBydW4gaW4gbm90ZXMgd2l0aCB0aGlzIGNzc2NsYXNzIGlmIHBvcHVsYXRlZFxyXG4gICAgcmVkaXJlY3RGb2xkZXJzOiBzdHJpbmdbXTsgICAvLyBvbmx5IHJ1biBpbiBub3RlcyB3aXRoaW4gdGhlc2UgZm9sZGVycyBpZiBwb3B1bGF0ZWRcclxuICAgIHNvdXJjZVByb3BlcnR5OiBzdHJpbmc7ICAgIC8vIGxpbmsgdG8gdGhlIHNvdXJjZSBmaWxlIChpLmUuIHRoZSBub3RlIGJlaW5nIHJlZGlyZWN0ZWQgZnJvbSlcclxuICAgIHJ1bGVzOiBSZWRpcmVjdFJ1bGVbXTsgICAgIC8vIG9yZGVyZWQ7IGZpcnN0IG1hdGNoIHdpbnNcclxufTtcclxuXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBCYXNlc0NhcmRSZWRpcmVjdFNldHRpbmdzID0ge1xyXG4gICAgcmVkaXJlY3RDc3NDbGFzczogXCJjYXJkLXJlZGlyZWN0XCIsXHJcbiAgICByZWRpcmVjdEZvbGRlcnM6IFtdLFxyXG4gICAgc291cmNlUHJvcGVydHk6IFwibGlua1wiLFxyXG4gICAgcnVsZXM6IFtcclxuICAgICAgICB7bWF0Y2hQcm9wZXJ0eTogXCJLaW5kXCIsIG1hdGNoVmFsdWU6IFwiU3RheVwiLCB0YXJnZXRQcm9wZXJ0eTogXCJDb3VudHJ5XCJ9XHJcbiAgICBdXHJcbn07XHJcblxyXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuLy8gU2V0dGluZ3MgVUkgKHdpdGggcmVvcmRlcilcclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmV4cG9ydCBjbGFzcyBCYXNlc0NhcmRSZWRpcmVjdFNldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcclxuICAgIHBsdWdpbjogQmFzZXNDYXJkUmVkaXJlY3Q7XHJcblxyXG4gICAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogQmFzZXNDYXJkUmVkaXJlY3QpIHtcclxuICAgICAgICBzdXBlcihhcHAsIHBsdWdpbik7XHJcbiAgICAgICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XHJcbiAgICB9XHJcblxyXG4gICAgZGlzcGxheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xyXG4gICAgICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XHJcbiAgICBcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBSZWRpcmVjdCBjc3NjbGFzc1xyXG4gICAgICAgIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlJlZGlyZWN0IGNzc2NsYXNzXCIpXHJcbiAgICAgICAgICAgIC5zZXREZXNjKFwiT25seSByZWRpcmVjdCBjbGlja3MgaW4gYmFzZSB2aWV3cyB3aGVyZSB0aGUgY29udGFpbmluZyBub3RlIGhhcyB0aGlzIGNzc2NsYXNzLiBMZWF2ZSBibGFuayB0byBhcHBseSB0byBhbGwgbm90ZXMgYXNzdW1pbmcgb3RoZXIgY3JpdGVyaWEgYXJlIG1ldC5cIilcclxuICAgICAgICAgICAgLmFkZFRleHQoKHQpID0+XHJcbiAgICAgICAgICAgICAgICB0XHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFBsYWNlaG9sZGVyKFwiQ1NTIGNsYXNzXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0Q3NzQ2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0Q3NzQ2xhc3MgPSB2LnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBSZWRpcmVjdCBmb2xkZXJzXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiUmVkaXJlY3QgZm9sZGVyc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIk9ubHkgcmVkaXJlY3QgY2xpY2tzIGluIGJhc2Ugdmlld3Mgd2hlcmUgdGhlIGNvbnRhaW5pbmcgbm90ZSBpcyB3aXRoaW4gdGhlc2UgZm9sZGVycyBvciB0aGVpciBzdWJmb2xkZXJzLiBMZWF2ZSBibGFuayB0byBhcHBseSB0byBhbGwgbm90ZXMgYXNzdW1pbmcgb3RoZXIgY3JpdGVyaWEgYXJlIG1ldC5cIik7XHJcblxyXG4gICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0Rm9sZGVycy5mb3JFYWNoKChmb2xkZXIsIGlkeCkgPT4ge1xyXG4gICAgICAgICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcclxuICAgICAgICAgICAgICAgIC5hZGRUZXh0KCh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJGb2xkZXIgcGF0aFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUoZm9sZGVyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRyaW1tZWQgPSB2LnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkID0gdHJpbW1lZCA9PT0gXCJcIiB8fCAhIXRoaXMucGx1Z2luLmFwcC52YXVsdC5nZXRGb2xkZXJCeVBhdGgodHJpbW1lZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmlucHV0RWwuc3R5bGUuYm9yZGVyQ29sb3IgPSB2YWxpZCA/IFwiXCIgOiBcInJlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbGlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmVkaXJlY3RGb2xkZXJzW2lkeF0gPSB0cmltbWVkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0LmlucHV0RWwuc2V0Q3NzUHJvcHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6IFwiMTAwJVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdDtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAuYWRkRXh0cmFCdXR0b24oKGIpID0+XHJcbiAgICAgICAgICAgICAgICAgICAgYlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInRyYXNoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zZXRUb29sdGlwKFwiUmVtb3ZlIGZvbGRlclwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5yZWRpcmVjdEZvbGRlcnMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5hZGRCdXR0b24oKGIpID0+XHJcbiAgICAgICAgICAgICAgICBiLnNldEJ1dHRvblRleHQoXCJBZGQgZm9sZGVyXCIpLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnJlZGlyZWN0Rm9sZGVycy5wdXNoKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgLy8gU291cmNlIHByb3BlcnR5XHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoclwiKTtcclxuICAgIFxyXG4gICAgICAgIG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKVxyXG4gICAgICAgICAgICAuc2V0TmFtZShcIlNvdXJjZSBwcm9wZXJ0eVwiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIlRoZSBmb3JtdWxhIGNvbHVtbiBuYW1lIGluIHRoZSBiYXNlIGNhcmQgdGhhdCBjb250YWlucyB0aGUgbGluayB0byB0aGUgc291cmNlIG5vdGUuXCIpXHJcbiAgICAgICAgICAgIC5hZGRUZXh0KCh0KSA9PlxyXG4gICAgICAgICAgICAgICAgdFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIkxpbmsgcHJvcGVydHlcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3Muc291cmNlUHJvcGVydHkpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLnNvdXJjZVByb3BlcnR5ID0gdi50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoclwiKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuICAgICAgICAvLyBNYXBwaW5nIHJ1bGVzXHJcbiAgICAgICAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXHJcbiAgICAgICAgICAgIC5zZXROYW1lKFwiTWFwcGluZyBydWxlc1wiKVxyXG4gICAgICAgICAgICAuc2V0RGVzYyhcIkZpcnN0IG1hdGNoIHdpbnMuIFVzZSB0aGUgdXAvZG93biBhcnJvd3MgdG8gcmVvcmRlciBydWxlcy5cIik7XHJcbiAgICBcclxuICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ydWxlcy5mb3JFYWNoKChydWxlLCBpZHgpID0+IHtcclxuICAgICAgICAgICAgY29uc3Qgc2V0dGluZyA9IG5ldyBTZXR0aW5nKGNvbnRhaW5lckVsKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnRhaW5lckVsLnNldENzc1Byb3BzKHtcclxuICAgICAgICAgICAgICAgIFwid2lkdGhcIjogXCIxMDAlXCIsXHJcbiAgICAgICAgICAgICAgICBcImZsZXhXcmFwXCI6IFwibm93cmFwXCJcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIHNldHRpbmcuYWRkVGV4dCgodCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdFxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRQbGFjZWhvbGRlcihcIk1hdGNoIHByb3BlcnR5XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFZhbHVlKHJ1bGUubWF0Y2hQcm9wZXJ0eSlcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS5tYXRjaFByb3BlcnR5ID0gdi50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5zZXRDc3NQcm9wcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjogXCIxMDAlXCJcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBzZXR0aW5nLmFkZFRleHQoKHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJNYXRjaCB2YWx1ZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXRWYWx1ZShydWxlLm1hdGNoVmFsdWUpXHJcbiAgICAgICAgICAgICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1bGUubWF0Y2hWYWx1ZSA9IHY7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHQuaW5wdXRFbC5zZXRDc3NQcm9wcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjogXCIxMDAlXCJcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHQ7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBzZXR0aW5nLmFkZFRleHQoKHQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRcclxuICAgICAgICAgICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJUYXJnZXQgcHJvcGVydHlcIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0VmFsdWUocnVsZS50YXJnZXRQcm9wZXJ0eSlcclxuICAgICAgICAgICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHYpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnVsZS50YXJnZXRQcm9wZXJ0eSA9IHYudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB0LmlucHV0RWwuc2V0Q3NzUHJvcHMoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6IFwiMTAwJVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB0O1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgc2V0dGluZy5hZGRFeHRyYUJ1dHRvbigoYikgPT5cclxuICAgICAgICAgICAgICAgIGJcclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcImFycm93LXVwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIHVwXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldERpc2FibGVkKGlkeCA9PT0gMClcclxuICAgICAgICAgICAgICAgICAgICAub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggPD0gMCkgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBydWxlcyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLnJ1bGVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBbcnVsZXNbaWR4IC0gMV0sIHJ1bGVzW2lkeF1dID0gW3J1bGVzW2lkeF0sIHJ1bGVzW2lkeCAtIDFdXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIHNldHRpbmcuYWRkRXh0cmFCdXR0b24oKGIpID0+XHJcbiAgICAgICAgICAgICAgICBiXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldEljb24oXCJhcnJvdy1kb3duXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJNb3ZlIGRvd25cIilcclxuICAgICAgICAgICAgICAgICAgICAuc2V0RGlzYWJsZWQoaWR4ID09PSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ydWxlcy5sZW5ndGggLSAxKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcnVsZXMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ydWxlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCA+PSBydWxlcy5sZW5ndGggLSAxKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFtydWxlc1tpZHhdLCBydWxlc1tpZHggKyAxXV0gPSBbcnVsZXNbaWR4ICsgMV0sIHJ1bGVzW2lkeF1dO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kaXNwbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgc2V0dGluZy5hZGRFeHRyYUJ1dHRvbigoYikgPT5cclxuICAgICAgICAgICAgICAgIGJcclxuICAgICAgICAgICAgICAgICAgICAuc2V0SWNvbihcInRyYXNoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJSZW1vdmUgcnVsZVwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucnVsZXMuc3BsaWNlKGlkeCwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgXHJcbiAgICAgICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpLmFkZEJ1dHRvbigoYikgPT5cclxuICAgICAgICAgICAgYi5zZXRCdXR0b25UZXh0KFwiQWRkIHJ1bGVcIikub25DbGljayhhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5ydWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBtYXRjaFByb3BlcnR5OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoVmFsdWU6IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UHJvcGVydHk6IFwiXCJcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59Il0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBS087OztBQ0xQLHNCQUlPO0FBZ0JBLElBQU0sbUJBQThDO0FBQUEsRUFDdkQsa0JBQWtCO0FBQUEsRUFDbEIsaUJBQWlCLENBQUM7QUFBQSxFQUNsQixnQkFBZ0I7QUFBQSxFQUNoQixPQUFPO0FBQUEsSUFDSCxFQUFDLGVBQWUsUUFBUSxZQUFZLFFBQVEsZ0JBQWdCLFVBQVM7QUFBQSxFQUN6RTtBQUNKO0FBS08sSUFBTSw4QkFBTixjQUEwQyxpQ0FBaUI7QUFBQSxFQUc5RCxZQUFZLEtBQVUsUUFBMkI7QUFDN0MsVUFBTSxLQUFLLE1BQU07QUFDakIsU0FBSyxTQUFTO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFVBQWdCO0FBQ1osVUFBTSxFQUFFLFlBQVksSUFBSTtBQUN4QixnQkFBWSxNQUFNO0FBS2xCLFFBQUksd0JBQVEsV0FBVyxFQUNsQixRQUFRLG1CQUFtQixFQUMzQixRQUFRLG9KQUFvSixFQUM1SjtBQUFBLE1BQVEsQ0FBQyxNQUNOLEVBQ0ssZUFBZSxXQUFXLEVBQzFCLFNBQVMsS0FBSyxPQUFPLFNBQVMsZ0JBQWdCLEVBQzlDLFNBQVMsT0FBTyxNQUFNO0FBQ25CLGFBQUssT0FBTyxTQUFTLG1CQUFtQixFQUFFLEtBQUs7QUFDL0MsY0FBTSxLQUFLLE9BQU8sYUFBYTtBQUFBLE1BQ25DLENBQUM7QUFBQSxJQUNUO0FBS0osUUFBSSx3QkFBUSxXQUFXLEVBQ2xCLFFBQVEsa0JBQWtCLEVBQzFCLFFBQVEsOEtBQThLO0FBRTNMLFNB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TztBQUdoQixlQUFXLFFBQVEsS0FBSyxTQUFTLE9BQU87QUFDcEMsWUFBTSxJQUFJLEdBQUcsS0FBSyxhQUFhO0FBQy9CLFVBQUksQ0FBQyxLQUFLLFNBQVMsR0FBRyxLQUFLLFVBQVUsRUFBRztBQUV4QyxZQUFNLFlBQVksR0FBRyxLQUFLLGNBQWM7QUFDeEMsWUFBTSxhQUFhLEtBQUssa0JBQWtCLFNBQVM7QUFDbkQsVUFBSSxXQUFZLFFBQU87QUFHdkIsYUFBTztBQUFBLElBQ1g7QUFFQSxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRVEsU0FBUyxPQUFnQixVQUEyQjtBQUN4RCxRQUFJLFNBQVMsS0FBTSxRQUFPO0FBQzFCLFFBQUksTUFBTSxRQUFRLEtBQUssRUFBRyxRQUFPLE1BQU0sS0FBSyxDQUFDLE1BQU0sS0FBSyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQzdFLFFBQUksT0FBTyxVQUFVLFNBQVUsUUFBTztBQUN0QyxXQUFPLE9BQU8sS0FBSyxNQUFNO0FBQUEsRUFDN0I7QUFBQSxFQUVRLGtCQUFrQixNQUE2QjtBQUNuRCxRQUFJLE9BQU8sU0FBUyxTQUFVLFFBQU87QUFHckMsVUFBTSxJQUFJLEtBQUssS0FBSyxFQUFFLE1BQU0sc0JBQXNCO0FBQ2xELFFBQUksQ0FBQyxFQUFHLFFBQU87QUFFZixVQUFNLFNBQVMsRUFBRSxDQUFDLEVBQUUsTUFBTSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUs7QUFDdkMsUUFBSSxDQUFDLE9BQVEsUUFBTztBQUVwQixVQUFNLFdBQVcsT0FBTyxZQUFZLEVBQUUsU0FBUyxLQUFLLElBQUksU0FBUyxHQUFHLE1BQU07QUFFMUUsVUFBTSxPQUFPLEtBQUssSUFBSSxjQUFjLHFCQUFxQixVQUFVLEVBQUU7QUFDckUsV0FBTyxnQkFBZ0IseUJBQVEsT0FBTztBQUFBLEVBQzFDO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLUSxZQUFZLEtBQThCO0FBQzlDLFVBQU0sV0FBVyxJQUFJLFdBQVc7QUFDaEMsVUFBTSxZQUFZLElBQUksV0FBVyxJQUFJO0FBQ3JDLFVBQU0sUUFBUSxJQUFJO0FBR2xCLFFBQUksYUFBYSxNQUFPLFFBQU87QUFHL0IsUUFBSSxhQUFhLFNBQVUsUUFBTztBQUVsQyxXQUFPO0FBQUEsRUFDWDtBQUFBLEVBRUEsTUFBYyxTQUFTLE1BQWEsTUFBa0M7QUFDbEUsVUFBTSxPQUFzQixLQUFLLElBQUksVUFBVSxRQUFRLFFBQVEsS0FBSztBQUNwRSxVQUFNLEtBQUssU0FBUyxNQUFNLEVBQUUsUUFBUSxLQUFLLENBQUM7QUFBQSxFQUM5QztBQUNKOyIsCiAgIm5hbWVzIjogWyJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
