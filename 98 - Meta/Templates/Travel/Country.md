---
Type: Country
Country Code: ""
Region: ""
Currency Codes: []
Capital: ""
Timezone: ""
Banner: ""
Icon: ""
Wishlist: false
Plugs: []
Packing: []
Emergency Number: ""
Tipping: ""
Visa: ""
Vaccine: ""
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
> > > **Capital** {{capitalLink}}
> > > **Region** {{region}}
> > > **Currency** {{currency}}
> > > **Languages** {{languages}}
> > > **Calling code** {{calling}}
> > > **Driving side** {{driving}}
> > > **Timezones** {{zones}}
> > > **Units** {{units}}
> > > **Names** {{names}}
> >
> > > [!col|box]
> > > ```travel
> > > fx
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > localTime
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > holidays
> > > ```
>
> > [!col|fill]
> > {{extract}}
> > {{wikiLink}}
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
> > > [Smartraveller: {{title}}](https://www.smartraveller.gov.au/search?search={{titleUrl}})
> > > **Visa** `INPUT[text:Visa]`
> > > **Vaccine** `INPUT[text:Vaccine]`
> >
> > > [!col|box]
> > > ```travel
> > > comingUp
> > > limit: 5
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > history
> > > ```
> >
> > > [!col|box]
> > > ```travel
> > > trips
> > > ```

---

## Cities & Regions
![[{{basesFolder}}/Locales.base#Cities & Regions]]


> [!columns|1-1-1]
> > [!col]
> > #### Food & Drink
> > ![[{{basesFolder}}/Food and Drink.base#Top rated]]
>
> > [!col]
> > #### Accommodation
> > ![[{{basesFolder}}/Accommodation.base#Top rated]]
>
> > [!col]
> > #### Attractions
> > ![[{{basesFolder}}/Attractions.base#Top rated]]

---

```mapview
{"name":"Default","mapZoom":5,"centerLat":{{centreLat}},"centerLng":{{centreLng}},"query":"linkedto:\"{{title}}\" AND NOT path:\"{{tripsFolder}}\"","chosenMapSource":{{mapSource}},"autoFit":true,"lock":false,"showLinks":false,"linkColor":"red","markerLabels":"off","embeddedHeight":450}
```
