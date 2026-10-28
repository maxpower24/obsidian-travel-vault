---
Type: Locale
Country: "[[Japan]]"
Region: "Kyoto"
Locale Type: "City"
Banner: "[[06 - Resources/Images/Cities & Regions/Kyoto, Japan/Kyoto, Japan.jpg]]"
Icon: "🏙️"
Coordinates: "35.011564,135.7681489"
Wishlist: false
Transit Card: ""
Airport Transfer: ""
Main Stations: ""
Ride Share: ""
Micromobility: ""
Typical Costs: ""
Areas to Avoid: ""
My Notes: ""
Last Refreshed: 2026-10-27
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
> > > **Country** [[Japan]]
> > > **State / Region** Kyoto
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** 1,463,723 (2020)
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/localTime", {"tz":"Asia/Tokyo","place":"Kyoto"})
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/weather", {"lat":35.011564,"lng":135.7681489})
> > > ```
> >
> > > [!col|box]
> > > **Best time to visit** Apr
> > > <small>Mild highs (18–28°) and below-average rain. 10-year averages.</small>
> > >
> > > | | High | Low | Rain |
> > > |---|---|---|---|
> > > | Jan | 8° | -1° | 54 mm |
> > > | Feb | 9° | 0° | 63 mm |
> > > | Mar | 14° | 3° | 116 mm |
> > > | Apr | 19° | 8° | 154 mm |
> > > | May | 23° | 13° | 185 mm |
> > > | Jun | 27° | 18° | 242 mm |
> > > | Jul | 31° | 23° | 258 mm |
> > > | Aug | 32° | 24° | 182 mm |
> > > | Sep | 28° | 20° | 192 mm |
> > > | Oct | 22° | 13° | 191 mm |
> > > | Nov | 16° | 7° | 69 mm |
> > > | Dec | 11° | 1° | 60 mm |
>
> > [!col|fill]
> > Kyoto, officially Kyoto City , is the capital city of Kyoto Prefecture in the Kansai region of Japan's largest and most populous island of Honshu. As of 2020, the city had a population of 1.46 million, making it the ninth-most populous city in Japan. More than half (56.8%) of Kyoto Prefecture's population resides in the city. The city is the cultural anchor of the substantially larger Greater Kyoto, a metropolitan statistical area home to approximately 3.8 million people. It is also part of the even larger Keihanshin metropolitan area, along with Osaka and Kobe.
> > [Wikipedia](https://en.wikipedia.org/wiki/Kyoto)
> >
> > **Notes**
> > ```meta-bind
> > INPUT[editor(class(mb-adaptive)):["My Notes"]]
> > ```
>
> > [!col]
> > > [!todo] Getting around
> > > **Transit card** `INPUT[text:["Transit Card"]]`
> > > **Airport transfer** `INPUT[text:["Airport Transfer"]]`
> > > **Main stations** `INPUT[text:["Main Stations"]]`
> > > **Ride share** `INPUT[text:["Ride Share"]]`
> > > **E-bikes & scooters** `INPUT[text:["Micromobility"]]`
> >
> > > [!info] Good to know
> > > **Typical costs** `INPUT[text:["Typical Costs"]]`
> > > **Areas to avoid** `INPUT[text:["Areas to Avoid"]]`
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/history", { field: "Locale" })
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
{"name":"Default","mapZoom":11,"centerLat":35.011564,"centerLng":135.7681489,"query":"linkedto:\"Kyoto, Japan\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
