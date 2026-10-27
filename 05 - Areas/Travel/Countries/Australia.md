---
Type: Country
Country Code: "AU"
Region: "Australia and New Zealand"
Banner: "[[06 - Resources/Images/Countries/AU/AU.jpg]]"
Icon: "[[06 - Resources/Images/Icons/Flags/AU.svg]]"
Wishlist: false
Plugs: []
Packing: []
Emergency Number: ""
Tipping: ""
Visa: ""
Vaccine: ""
My Notes: ""
Last Refreshed: 2026-10-27
cssclasses:
  - full-width
  - location-note
  - hide-properties
---
```dataviewjs
const cur = dv.current();
const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
const now = dv.date("now");
const itins  = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country));
const places = dv.pages().where((p) => p.Type === "Place" && here(p.Country));
const past     = itins.where((i) => i.End && dv.date(i.End) < now);
const upcoming = itins.where((i) => !i.End || dv.date(i.End) >= now);
const status = (past.length || places.where((p) => p.Visited).length) ? "Visited"
             : upcoming.length ? "Planned"
             : (cur.Wishlist || places.length) ? "Saved" : "Reference";
// next visit = earliest upcoming itinerary in this country (dated first), via its trip
const next = upcoming.sort((i) => i.Start ? dv.date(i.Start).toMillis() : Number.MAX_SAFE_INTEGER, "asc").first();
let nextText = "";
if (next) {
    const trip = next.Trip ? dv.page(next.Trip) : null;
    const start = next.Start ? dv.date(next.Start) : (trip?.Start ? dv.date(trip.Start) : null);
    const name = trip ? `[[${trip.file.path}|${trip.file.name}]]` : next.file.link;
    if (start && start <= now) nextText = `Now · ${name}`;
    else if (start) nextText = `Next visit: ${name} · in ${Math.ceil(start.diff(now, "days").days)} days`;
    else nextText = `Next visit: ${name} · dates TBC`;
}
const el = dv.el("div", "", { cls: "travel-status-bar" });
dv.paragraph(`<span class="travel-status travel-status-${status.toLowerCase()}">${status}</span>${nextText ? " · " + nextText : ""}`, { container: el });
```

> [!columns|1-2.5-1 centre-first stretch]
> > [!col]
> > > [!col|box]
> > > **Capital** [[Canberra, Australia]]
> > > **Region** Australia and New Zealand
> > > **Currency** AUD · Australian dollar · $
> > > **Languages** English
> > > **Calling code** +61
> > > **Driving side** Left
> > > **Timezones** UTC+05:00, UTC+06:30, UTC+07:00, UTC+08:00, UTC+09:30, UTC+10:00, UTC+10:30, UTC+11:30
> > > **Units** Metric · Celsius
> > > **Names** Commonwealth of Australia · Australia
> >
> > > [!col|box]
> > > ```dataviewjs
> > > const BASE = "AUD";
> > > const CODES = ["AUD"];
> > > const KEY = "travel-vault-fx-" + BASE;
> > > const el = dv.el("div", "Loading exchange rate…");
> > > (async () => {
> > >     let data = null;
> > >     try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
> > >     const fresh = data && Date.now() / 1000 < data.time_next_update_unix;
> > >     if (!fresh) {
> > >         try {
> > >             const res = await fetch("https://open.er-api.com/v6/latest/" + BASE);
> > >             const json = await res.json();
> > >             if (json.result === "success") { data = json; localStorage.setItem(KEY, JSON.stringify(json)); }
> > >         } catch (e) { console.error("FX fetch failed", e); }
> > >     }
> > >     if (!data?.rates) { el.setText("Exchange rate unavailable"); return; }
> > >     const fmt = (n) => n.toLocaleString("en-AU", { maximumFractionDigits: n < 10 ? 2 : 0 });
> > >     const lines = CODES.filter((c) => data.rates[c]).flatMap((c) => {
> > >         const r = data.rates[c], unit = Math.pow(10, Math.max(0, Math.round(Math.log10(r))));
> > >         return [`**1 ${BASE}** ≈ ${fmt(r)} ${c}`, `**${unit.toLocaleString("en-AU")} ${c}** ≈ ${fmt(unit / r)} ${BASE}`];
> > >     });
> > >     const day = new Date(data.time_last_update_unix * 1000).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
> > >     el.empty();
> > >     dv.paragraph((lines.length ? lines.join("<br>") : "No rate for " + CODES.join(", ")) + `<br><small>Updated ${day}</small>`, { container: el });
> > > })();
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > const TZ = "Australia/Sydney", HOME = "Australia/Melbourne", HOME_NAME = "Melbourne", PLACE = "Canberra";
> > > if (!TZ) { dv.paragraph("Local time unavailable"); } else {
> > >     const off = (tz, d) => { const v = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(d).find((p) => p.type === "timeZoneName").value; const m = v.match(/GMT([+-])(\d+)(?::(\d+))?/); if (!m) return 0; const n = +m[2] * 60 + +(m[3] || 0); return m[1] === "-" ? -n : n; };
> > >     const el = dv.el("div", "");
> > >     const render = () => {
> > >         const now = new Date();
> > >         const t = now.toLocaleTimeString("en-AU", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
> > >         const d = now.toLocaleDateString("en-AU", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
> > >         const diff = off(TZ, now) - off(HOME, now), h = Math.abs(diff) / 60;
> > >         const rel = diff === 0 ? "same as " + HOME_NAME : `${Number.isInteger(h) ? h : h.toFixed(1)} h ${diff > 0 ? "ahead of" : "behind"} ${HOME_NAME}`;
> > >         el.innerHTML = `<div style="font-size:1.8em;font-weight:600;line-height:1.1">${t}</div><div>${PLACE} · ${d}</div><small>${rel}</small>`;
> > >     };
> > >     render();
> > >     const timer = setInterval(() => { if (!el.isConnected) clearInterval(timer); else render(); }, 30000);
> > > }
> > > ```
> >
> > > [!col|box]
> > > **Holidays**
> > > ```dataviewjs
> > > const CC = "AU";
> > > const GOOGLE_IDS = {"TH":"en.th","TW":"en.taiwan"};   // Google Calendar fallback (from travel config)
> > > const cur = dv.current();
> > > const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > // trip windows in this country, for highlighting
> > > const windows = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country) && p.Trip)
> > >     .map((i) => dv.page(i.Trip)).filter((t) => t && t.Start && t.End)
> > >     .map((t) => ({ name: t.file.name, start: dv.date(t.Start).toISODate(), end: dv.date(t.End).toISODate() })).array();
> > > const el = dv.el("div", "Loading…");
> > > (async () => {
> > >     let list = [];
> > >     try {
> > >         const res = await fetch(`https://date.nager.at/api/v3/NextPublicHolidays/${CC}`);
> > >         if (res.ok) list = (await res.json()).filter((h) => h.global).map((h) => ({ date: h.date, name: h.name }));
> > >     } catch (e) {}
> > >     if (!list.length && GOOGLE_IDS[CC]) {
> > >         try {
> > >             const id = encodeURIComponent(GOOGLE_IDS[CC] + "#holiday@group.v.calendar.google.com");
> > >             const txt = await (await fetch(`https://calendar.google.com/calendar/ical/${id}/public/basic.ics`)).text();
> > >             const today = new Date().toISOString().slice(0, 10);
> > >             list = txt.replace(/\r?\n[ \t]/g, "").split("BEGIN:VEVENT").slice(1).map((b) => {
> > >                 const g = (k) => (b.match(new RegExp(`^${k}[^:]*:(.*)$`, "m")) || [])[1]?.trim() ?? "";
> > >                 const d = g("DTSTART");
> > >                 return { date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`, name: g("SUMMARY"), pub: g("DESCRIPTION").startsWith("Public holiday") };
> > >             }).filter((h) => h.pub && h.date >= today).sort((a, b) => a.date.localeCompare(b.date));
> > >         } catch (e) {}
> > >     }
> > >     el.empty();
> > >     if (!list.length) { el.setText("No holiday data"); return; }
> > >     const inTrip = (d) => windows.find((w) => d >= w.start && d <= w.end);
> > >     const shown = [...list.slice(0, 3), ...list.slice(3).filter((h) => inTrip(h.date))];
> > >     const fmt = (d) => new Date(d + "T00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });
> > >     dv.paragraph(shown.map((h) => { const t = inTrip(h.date); return `${fmt(h.date)} · ${h.name}${t ? ` <small>(during ${t.name})</small>` : ""}`; }).join("<br>"), { container: el });
> > > })();
> > > ```
>
> > [!col|fill]
> > Australia, officially the Commonwealth of Australia, is a country comprising the mainland of the Australian continent, the island of Tasmania and numerous smaller islands. It has a land area of 7,688,287 km2 (2,968,464 sq mi), making it the sixth-largest country in the world, and is the world's flattest and driest inhabited continent. It is a megadiverse country, and its size gives it a wide variety of landscapes and climates, including large deserts centrally and tropical rainforests along the coast.
> > [Wikipedia](https://en.wikipedia.org/wiki/Australia)
> >
> > **Routine Packing List**
> > ```meta-bind
> > INPUT[list:Packing]
> > ```
> >
> > **Notes**
> > ```meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > ```
>
> > [!col]
> > > [!todo] Local Essentials
> > > **Plugs** `INPUT[inlineListSuggester(option(A), option(B), option(C), option(D), option(E), option(F), option(G), option(H), option(I), option(J), option(K), option(L), option(M), option(N), option(O)):Plugs]`
> > > **Emergency** `INPUT[text:["Emergency Number"]]`
> > > **Tipping** `INPUT[inlineSelect(option(Not expected), option(Appreciated), option(Expected), option(Considered rude)):Tipping]`
> >
> > > [!info] Entry & Health
> > > [Smartraveller: Australia](https://www.smartraveller.gov.au/search?search=Australia)
> > > **Visa** `INPUT[text:Visa]`
> > > **Vaccine** `INPUT[text:Vaccine]`
> >
> > > [!col|box]
> > > ```dataviewjs
> > > const cur = dv.current();
> > > const isHere = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > const places = dv.pages().where((p) => p.Type === "Place" && isHere(p.Country));
> > > const itins  = dv.pages().where((p) => p.Type === "Itinerary" && isHere(p.Country));
> > > const trips  = new Set(itins.map((i) => i.Trip && dv.page(i.Trip)?.file.path).filter(Boolean).array());
> > > const now = dv.date("now");
> > > const dates = [
> > >     ...places.where((p) => p.Visited && p["Last Visited"]).map((p) => dv.date(p["Last Visited"])).array(),
> > >     ...itins.where((i) => i.End && dv.date(i.End) < now).map((i) => dv.date(i.End)).array(),
> > > ].filter(Boolean).sort((a, b) => b - a);
> > > dv.paragraph([
> > >     `**Places saved** ${places.length}`,
> > >     `**Places visited** ${places.where((p) => p.Visited).length}`,
> > >     `**Last visited** ${dates.length ? dates[0].toFormat("MMM yyyy") : "never"}`,
> > > ].join("<br>"));
> > > ```
> >
> > > [!col|box]
> > > **Trips**
> > > ```dataviewjs
> > > const cur = dv.current();
> > > const here = (l) => l && dv.page(l)?.file.path === cur.file.path;
> > > const now = dv.date("now");
> > > const tripStatus = (t) => {
> > >     if (t.Cancelled) return "Cancelled";
> > >     if (!t.Start) return "Idea";
> > >     if (t.End && dv.date(t.End) < now) return "Done";
> > >     if (dv.date(t.Start) <= now) return "Active";
> > >     return t.Booked ? "Booked" : "Planning";
> > > };
> > > const seen = new Set();
> > > const trips = dv.pages().where((p) => p.Type === "Itinerary" && here(p.Country) && p.Trip)
> > >     .map((i) => dv.page(i.Trip)).filter((t) => t && !seen.has(t.file.path) && seen.add(t.file.path))
> > >     .sort((t) => t.Start ? dv.date(t.Start).toMillis() : 0, "desc");
> > > if (!trips.length) dv.paragraph("No trips yet");
> > > else dv.paragraph(trips.map((t) => {
> > >     const range = t.Start ? `${dv.date(t.Start).toFormat("d MMM yyyy")}${t.End ? " – " + dv.date(t.End).toFormat("d MMM yyyy") : ""}` : "dates TBC";
> > >     return `${t.file.link} · ${range} · ${tripStatus(t)}`;
> > > }).join("<br>"));
> > > ```

---

## Cities & Regions
![[98 - Meta/Databases/Travel/Locales.base#Cities & Regions]]


> [!columns|1-1-1]
> > [!col]
> > #### Food & Drink
> > ![[98 - Meta/Databases/Travel/Food and Drink.base#Top rated]]
>
> > [!col]
> > #### Accommodation
> > ![[98 - Meta/Databases/Travel/Accommodation.base#Top rated]]
>
> > [!col]
> > #### Attractions
> > ![[98 - Meta/Databases/Travel/Attractions.base#Top rated]]

---

```mapview
{"name":"Default","mapZoom":5,"centerLat":-25,"centerLng":133,"query":"linkedto:\"Australia\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
