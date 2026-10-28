```dataviewjs
await dv.view("98 - Meta/Views/nav")
```
Travel dashboard.

```meta-bind-button
label: New Trip
style: primary
action:
  type: templaterCreateNote
  templateFile: "98 - Meta/Templates/Travel/Trip Template.md"
  folderPath: "05 - Areas/Travel/Trips"
  fileName: "New Trip"
  openNote: true
```
```meta-bind-button
label: New / Refresh Country
style: default
action:
  type: runTemplaterFile
  templateFile: "98 - Meta/Templates/Travel/Country Template.md"
```
```meta-bind-button
label: New / Refresh City or Region
style: default
action:
  type: runTemplaterFile
  templateFile: "98 - Meta/Templates/Travel/City Template.md"
```

Planned items:
- Quick actions
	- Create trip
	- Create Location
- Dashboards/tables/card views detailing upcoming, current and past trips
- Active to-do list, shopping list, packing list, visa info, insurance info for next upcoming trip (each trip will also have their own dashboard for this)
- Anything required for broader trip management
