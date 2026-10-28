// neighbourhoods.js — this locale's places grouped by their Area field
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const places = dv.pages().where((p) => p.Type === "Place" && here(p.Locale) && p.Area);
if (!places.length) { dv.paragraph("Neighbourhoods appear once places have an Area"); return; }
const groups = places.groupBy((p) => p.Area).sort((g) => g.rows.length, "desc");
dv.paragraph(groups.map((g) => `**${g.key}** · ${g.rows.sort((p) => p.file.name).map((p) => p.file.link).join(", ")}`).array().join("<br>"));
