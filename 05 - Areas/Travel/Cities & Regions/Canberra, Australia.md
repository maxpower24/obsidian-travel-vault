---
Type: Locale
Country: "[[Australia]]"
Region: "Australian Capital Territory"
Locale Type: "City"
Banner: "[[06 - Resources/Images/Cities & Regions/Canberra, Australia/Canberra, Australia.jpg]]"
Icon: "🏙️"
Coordinates: "-35.2801846,149.13103239999998"
Wishlist: false
Transit Card: ""
Airport Transfer: ""
Ride Share: ""
Micromobility: ""
Safety: ""
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
await dv.view("98 - Meta/Views/Travel/status", { field: "Locale" })
```

> [!columns|1-2.5-1 centre-first stretch]
> > [!col]
> > > [!col|box]
> > > **Country** [[Australia]]
> > > **State / Region** Australian Capital Territory
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** —
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/fromCountry")
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/localTime", {"tz":"Australia/Sydney","place":"Canberra"})
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/weather", {"lat":-35.2801846,"lng":149.13103239999998})
> > > ```
>
> > [!col|fill]
> > 
> > 
> >
> > ```dataviewjs
> > await dv.view("98 - Meta/Views/Travel/climate", {"months":[[28,15,77],[26,14,50],[24,13,62],[20,9,44],[15,4,47],[11,2,54],[11,2,45],[12,2,56],[16,4,57],[19,7,62],[22,10,88],[26,13,71]],"best":[false,true,false,true,false,false,false,false,false,false,false,false]})
> > ```
> >
> > **Notes**
> > ```meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > ```
>
> > [!col]
> > > [!todo] Local Tips
> > > **Transit card** `INPUT[text:["Transit Card"]]`
> > > **Airport transfer** `INPUT[text:["Airport Transfer"]]`
> > > **Ride share** `INPUT[text:["Ride Share"]]`
> > > **E-bikes & scooters** `INPUT[text:["Micromobility"]]`
> > >
> > > **Safety**
> > > ```meta-bind
> > > INPUT[textArea(class(travel-safety)):Safety]
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/onThePlan", { field: "Locale" })
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/stillToDo", { field: "Locale" })
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/history", { field: "Locale", stays: true })
> > > ```
> >
> > > [!col|box]
> > > **Trips**
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/trips", { field: "Locale" })
> > > ```

---

## Places
![[98 - Meta/Databases/Travel/Locale Places.base#Google rating]]

> [!columns|1-1]
> > [!col]
> > #### Neighbourhoods
> > ```dataviewjs
> > await dv.view("98 - Meta/Views/Travel/neighbourhoods")
> > ```
>
> > [!col]
> > #### Nearby Cities & Regions
> > ```dataviewjs
> > await dv.view("98 - Meta/Views/Travel/nearby")
> > ```

---

```mapview
{"name":"Default","mapZoom":11,"centerLat":-35.2801846,"centerLng":149.13103239999998,"query":"linkedto:\"Canberra, Australia\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
