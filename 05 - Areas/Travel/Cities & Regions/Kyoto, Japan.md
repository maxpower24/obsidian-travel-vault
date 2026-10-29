---
Type: Locale
Country: "[[Japan]]"
Region: "Kyoto"
Locale Type: "City"
Banner: "[[06 - Resources/Images/Cities & Regions/Kyoto, Japan/Kyoto, Japan.jpg]]"
Icon: "🏙️"
Coordinates: "35.011564,135.7681489"
Timezone: "Asia/Tokyo"
Wishlist: false
Transit Card: ""
Airport Transfer: ""
Ride Share: ""
Micromobility: ""
Safety: ""
My Notes: ""
Last Refreshed: 2026-10-29
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
> > > **Country** [[Japan]]
> > > **State / Region** Kyoto
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** 1,448,964 (2022)
> > >
> > > ```meta-bind-button
> > > label: Add to Trip
> > > style: primary
> > > action:
> > >   type: command
> > >   command: travel:add-to-trip
> > > ```
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
> > Kyoto, officially Kyoto City , is the capital city of Kyoto Prefecture in the Kansai region of Japan's largest and most populous island of Honshu. As of 2020, the city had a population of 1.46 million, making it the ninth-most populous city in Japan. More than half (56.8%) of Kyoto Prefecture's population resides in the city. The city is the cultural anchor of the substantially larger Greater Kyoto, a metropolitan statistical area home to approximately 3.8 million people. It is also part of the even larger Keihanshin metropolitan area, along with Osaka and Kobe.
> > [Wikipedia](https://en.wikipedia.org/wiki/Kyoto)
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
{"name":"Default","mapZoom":11,"centerLat":35.011564,"centerLng":135.7681489,"query":"linkedto:\"Kyoto, Japan\" AND NOT path:\"05 - Areas/Travel/Trips\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
