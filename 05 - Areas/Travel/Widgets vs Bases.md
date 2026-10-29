---
cssclasses:
  - full-width
---
```nav
```
# Widgets vs Bases Views

The four list widgets, each shown twice for **Tokyo**: on the left the ```` ```travel ```` widget, on the right the same list as a **Travel List** Bases view (`98 - Meta/Databases/Travel/Comparison.base`).

**What to compare**
- **Looks**: the lines are drawn by the same code, so differences come from the Bases frame (toolbar, result count, padding).
- **Changing a list**: widget = edit the plugin (or its options in the block, e.g. `limit: 5`). Bases = the view's settings menu (filter, sort, group, limit), no code.
- **Behaviour**: a widget can hide its box when empty and add extras (Coming Up's "1 undated idea", "+ 2 more"); a Bases view always shows its frame.
- **Speed**: open Tokyo and this note and compare; Bases views also refresh themselves when notes change.

Known difference: the Bases Coming Up also lists transport *from* Tokyo (it matches any link to Tokyo); the widget only matches the Locale field.

> [!columns|1-1]
> > [!col|box]
> > **Widget** · Coming Up
> > ```travel
> > comingUp
> > note: "[[Tokyo, Japan]]"
> > ```
>
> > [!col|box]
> > **Bases View** · Coming Up
> > ![[98 - Meta/Databases/Travel/Comparison.base#Coming Up]]

> [!columns|1-1]
> > [!col|box]
> > **Widget** · Yet to Visit
> > ```travel
> > yetToVisit
> > note: "[[Tokyo, Japan]]"
> > ```
>
> > [!col|box]
> > **Bases View** · Yet to Visit
> > ![[98 - Meta/Databases/Travel/Comparison.base#Yet to Visit]]

> [!columns|1-1]
> > [!col|box]
> > **Widget** · Trips
> > ```travel
> > trips
> > note: "[[Tokyo, Japan]]"
> > ```
>
> > [!col|box]
> > **Bases View** · Trips
> > ![[98 - Meta/Databases/Travel/Comparison.base#Trips]]

> [!columns|1-1]
> > [!col|box]
> > **Widget** · Neighbourhoods
> > ```travel
> > neighbourhoods
> > note: "[[Tokyo, Japan]]"
> > ```
>
> > [!col|box]
> > **Bases View** · Neighbourhoods
> > ![[98 - Meta/Databases/Travel/Comparison.base#Neighbourhoods]]

Neighbourhoods is empty in both until places have an `Area`.
