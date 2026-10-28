---
Type: Country
Country Code: "AU"
Region: "Australia and New Zealand"
Currency Codes: ["AUD"]
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
Last Refreshed: 2026-10-28
cssclasses:
  - full-width
  - location-note
  - hide-properties
---
```dataviewjs
await dv.view("98 - Meta/Views/nav")
```
```dataviewjs
await dv.view("98 - Meta/Views/Travel/status", { field: "Country" })
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
> > > await dv.view("98 - Meta/Views/Travel/fx", { codes: ["AUD"] })
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/localTime", {"tz":"Australia/Sydney","place":"Canberra"})
> > > ```
> >
> > > [!col|box]
> > > **Holidays**
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/holidays", { cc: "AU" })
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
> > > await dv.view("98 - Meta/Views/Travel/onThePlan", { field: "Country", limit: 5 })
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/history", { field: "Country" })
> > > ```
> >
> > > [!col|box]
> > > **Trips**
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/trips", { field: "Country" })
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
