/**
 * ui.js — a small Obsidian-styled pop-up built from plain DOM (dataviewjs has no access to Obsidian's
 * Modal class). module.exports = { openModal(title, build) } where build(contentEl, close) fills it.
 */
module.exports = {
    openModal(title, build) {
        const container = document.body.createDiv({ cls: "modal-container mod-dim travel-modal" });
        const close = () => { document.removeEventListener("keydown", onKey, true); container.remove(); };
        const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } };
        document.addEventListener("keydown", onKey, true);
        container.createDiv({ cls: "modal-bg" }).onclick = close;
        const modal = container.createDiv({ cls: "modal" });
        modal.createDiv({ cls: "modal-close-button" }).onclick = close;
        modal.createDiv({ cls: "modal-title", text: title });
        const content = modal.createDiv({ cls: "modal-content" });
        build(content, close);
        return close;
    },
};
