// fromCountry.js — the country's essentials shown on a city note (read live from the country note)
const cur = dv.current();
const c = cur.Country ? dv.page(cur.Country) : null;
const box = dv.el("div", "", { cls: "travel-from-country" });
if (!c) { box.setText("No country note linked"); return; }
dv.paragraph(`**From** ${c.file.link}`, { container: box });
const list = (v) => (Array.isArray(v) ? v.join(", ") : v) || "—";
dv.paragraph([
    `**Plugs** ${list(c.Plugs)}`,
    `**Emergency** ${c["Emergency Number"] || "—"}`,
    `**Tipping** ${c.Tipping || "—"}`,
].join("<br>"), { container: box });
const codes = c["Currency Codes"] ?? [];
if (codes.length) await dv.view("98 - Meta/Views/Travel/fx", { codes: Array.isArray(codes) ? codes : [codes] });
