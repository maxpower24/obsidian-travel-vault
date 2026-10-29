---
Type: Locale
Country: "[[Japan]]"
Region: "Tokyo"
Locale Type: "City"
Banner: "[[06 - Resources/Images/Cities & Regions/Tokyo, Japan/Tokyo, Japan.jpg]]"
Icon: "🏙️"
Coordinates: "35.6764225,139.650027"
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
> > > **State / Region** Tokyo
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** 14,264,798 (2022)
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
> > Tokyo, officially the Tokyo Metropolis, is the capital and most populous city of Japan. The population of the city proper was over 14 million as of 2023. The Greater Tokyo Area, which includes Tokyo and parts of six neighboring prefectures, is the third-most populous metropolitan area in the world, with 33 million residents as of 2025.
> > [Wikipedia](https://en.wikipedia.org/wiki/Tokyo)
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
{"name":"Default","mapZoom":11,"centerLat":35.6764225,"centerLng":139.650027,"query":"linkedto:\"Tokyo, Japan\" AND NOT path:\"05 - Areas/Travel/Trips\"","chosenMapSource":1,"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
