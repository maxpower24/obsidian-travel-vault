---
Type: Locale
Country: "[[Japan]]"
Region: "Tokyo"
Locale Type: "City"
Banner: "[[06 - Resources/Images/Cities & Regions/Tokyo, Japan/Tokyo, Japan.jpg]]"
Icon: "🏙️"
Coordinates: "35.6764225,139.650027"
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
> > > **Country** [[Japan]]
> > > **State / Region** Tokyo
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** 14,264,798 (2022)
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/fromCountry")
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/localTime", {"tz":"Asia/Tokyo","place":"Tokyo"})
> > > ```
> >
> > > [!col|box]
> > > ```dataviewjs
> > > await dv.view("98 - Meta/Views/Travel/weather", {"lat":35.6764225,"lng":139.650027})
> > > ```
>
> > [!col|fill]
> > Tokyo, officially the Tokyo Metropolis, is the capital and most populous city of Japan. The population of the city proper was over 14 million as of 2023. The Greater Tokyo Area, which includes Tokyo and parts of six neighboring prefectures, is the third-most populous metropolitan area in the world, with 33 million residents as of 2025.
> > [Wikipedia](https://en.wikipedia.org/wiki/Tokyo)
> >
> > ```dataviewjs
> > await dv.view("98 - Meta/Views/Travel/climate", {"months":[[9,0,51],[11,1,51],[14,5,143],[19,10,135],[23,14,154],[26,19,192],[30,23,178],[32,24,140],[28,21,208],[22,14,201],[17,8,83],[11,2,56]],"best":[false,false,false,true,false,false,false,false,false,false,false,false]})
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
{"name":"Default","mapZoom":11,"centerLat":35.6764225,"centerLng":139.650027,"query":"linkedto:\"Tokyo, Japan\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
