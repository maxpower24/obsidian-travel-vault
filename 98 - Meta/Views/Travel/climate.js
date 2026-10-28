// climate.js — best time to visit: 12 month tiles (2 rows × 6), from averages calculated by City Template.
// input: { months: [[high, low, rainMm] ×12], best: [bool ×12] }
const months = input?.months;
const best   = input?.best ?? [];
const box = dv.el("div", "", { cls: "travel-climate" });
if (!months?.length) { box.setText("Climate data unavailable"); return; }
const NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// summary line: best months as ranges ("Mar–May, Oct")
const ranges = [];
for (let i = 0; i < 12; i++) {
    if (!best[i] || (i > 0 && best[i - 1])) continue;
    let j = i; while (j < 11 && best[j + 1]) j++;
    ranges.push(i === j ? NAMES[i] : `${NAMES[i]}–${NAMES[j]}`);
}
const head = box.createDiv({ cls: "travel-climate-head" });
head.createEl("strong", { text: "Best Time to Visit" });
head.createSpan({ cls: "travel-sep", text: "·" });
head.appendText(ranges.length ? ranges.join(", ") : "no standout months");
box.createEl("small", { text: "A guide: mild highs (18–28°) and below-average rain, from 10-year averages." });

// months with a trip here (itinerary notes on this locale)
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const tripMonths = new Set(dv.pages().where((p) => p.Type === "Itinerary" && here(p.Locale) && p.Start)
    .map((p) => dv.date(p.Start).month - 1).array());
const thisMonth = new Date().getMonth();

// tile colour follows the average high: cool blue → mild green → hot red
const hue  = (t) => Math.max(0, Math.min(220, 220 - (t + 5) * 6.3));   // -5° ≈ 220 (blue), 30° ≈ 0 (red)
const maxRain = Math.max(...months.map((m) => m[2]), 1);

const grid = box.createDiv({ cls: "travel-climate-grid" });
months.forEach(([hi, lo, rain], i) => {
    const tile = grid.createDiv({ cls: "travel-climate-month" + (best[i] ? " is-best" : "") + (i === thisMonth ? " is-now" : "") });
    tile.style.setProperty("--tile-hue", hue(hi));
    const top = tile.createDiv({ cls: "travel-climate-name" });
    top.setText(NAMES[i]);
    if (best[i]) top.createSpan({ cls: "travel-climate-badge", text: "★" });
    if (tripMonths.has(i)) top.createSpan({ cls: "travel-climate-badge", text: "✈️", attr: { title: "You have a trip here this month" } });
    tile.createDiv({ cls: "travel-climate-hi", text: `${hi}°` });
    tile.createDiv({ cls: "travel-climate-lo", text: `${lo}°` });
    const r = tile.createDiv({ cls: "travel-climate-rain" });
    r.createDiv({ cls: "travel-climate-rainbar" }).style.width = `${Math.round((rain / maxRain) * 100)}%`;
    r.createSpan({ text: `${rain} mm` });
});
