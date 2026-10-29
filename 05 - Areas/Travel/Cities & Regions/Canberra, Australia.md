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
```nav
```
```travel
status
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
> > > ```travel
> > > fromCountry
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > localTime
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > weather
> > > ```
>
> > [!col|fill]
> > 
> > 
> >
> > ```travel
> > climate
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
> > > ```travel
> > > comingUp
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > yetToVisit
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > history
> > > stays: true
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > trips
> > > ```

---

## Places
![[98 - Meta/Databases/Travel/Locale Places.base#Google rating]]

> [!columns|1-1]
> > [!col]
> > #### Neighbourhoods
> > ```travel
> > neighbourhoods
> > ```
>
> > [!col]
> > #### Nearby Cities & Regions
> > ```travel
> > nearby
> > ```

---

```mapview
{"name":"Default","mapZoom":11,"centerLat":-35.2801846,"centerLng":149.13103239999998,"query":"linkedto:\"Canberra, Australia\" AND NOT path:\"05 - Areas/Travel/Trips\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
