---
Type: Locale
Country: ""
Region: ""
Locale Type: City
Banner: ""
Icon: ""
Coordinates: ""
Timezone: ""
Wishlist: false
Transit Card: ""
Airport Transfer: ""
Ride Share: ""
Micromobility: ""
Safety: ""
My Notes: ""
Last Refreshed:
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
> > > **Country** {{countryLink}}
> > > **State / Region** {{state}}
> > > **Type** `INPUT[inlineSelect(option(City), option(Region), option(Island)):["Locale Type"]]`
> > > **Population** {{population}}
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
> > {{extract}}
> > {{wikiLink}}
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
![[{{basesFolder}}/Locale Places.base#Google rating]]

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
{"name":"Default","mapZoom":11,"centerLat":{{lat}},"centerLng":{{lng}},"query":"linkedto:\"{{title}}\" AND NOT path:\"{{tripsFolder}}\"","chosenMapSource":{{mapSource}},"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
