/**
 * dom.js — draws widget text straight into the page, without Obsidian's markdown renderer
 * (dv.paragraph / dv.span send every call through it, which is what made widgets slow to appear).
 * module.exports = (app, sourcePath) => ({ p(el, text), span(el, text), div(el, text) })
 * Understands only what the widgets use:
 *   **bold** · [[path|text]] (internal link: click, Ctrl/Cmd-click for a new tab, hover preview)
 *   [text](https://…) (external link) · <br> · <small>…</small> · <span class="…"> / <span style="…"> · <div …>
 * Everything else is shown as plain text (so a "<" in a note name can't break the page).
 */
module.exports = (app, sourcePath) => {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const TAGS = /(<br\s*\/?>|<\/?small>|<\/span>|<\/div>|<span (?:class|style)="[^"<>]*">|<div (?:class|style)="[^"<>]*">)/g;
    const inline = (s) => esc(s)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, path, text) =>
            `<a class="internal-link" data-href="${path}" href="${path}">${text ?? path.split("/").pop().replace(/\.md$/, "")}</a>`)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a class="external-link" href="$2" target="_blank" rel="noopener">$1</a>');
    const toHtml = (text) => String(text ?? "").split(TAGS).map((part, i) => (i % 2 ? part : inline(part))).join("");
    const wire = (root) => {
        root.querySelectorAll("a.internal-link").forEach((a) => {
            const target = a.getAttribute("data-href");
            a.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();   // reading view also handles .internal-link clicks; don't open it twice
                app.workspace.openLinkText(target, sourcePath, e.ctrlKey || e.metaKey ? "tab" : false);
            });
            a.addEventListener("mouseover", (e) => app.workspace.trigger("hover-link", {
                event: e, source: "preview", hoverParent: root, targetEl: a, linktext: target, sourcePath,
            }));
        });
        return root;
    };
    const make = (tag) => (el, text) => { const n = el.createEl(tag); n.innerHTML = toHtml(text); return wire(n); };
    return { p: make("p"), span: make("span"), div: make("div"), html: toHtml };
};
