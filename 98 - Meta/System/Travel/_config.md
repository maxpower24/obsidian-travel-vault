---
Module Root: 05 - Areas/Travel
Nav Rules: 98 - Meta/Views/Travel/travelNav.js
Countries Folder: 05 - Areas/Travel/Countries
Locales Folder: 05 - Areas/Travel/Cities & Regions
Places Folder: 05 - Areas/Travel/Places
Trips Folder: 05 - Areas/Travel/Trips
Places Inbox: 06 - Resources/Google Places
Country Images Folder: 06 - Resources/Images/Countries
Locale Images Folder: 06 - Resources/Images/Cities & Regions
Trip Images Folder: 06 - Resources/Images/Trips
Trip Documents Folder: 06 - Resources/Documents/Trips
Flags Folder: 06 - Resources/Images/Icons/Flags
Bases Folder: 98 - Meta/Databases/Travel
Packing Baseline: 98 - Meta/System/Travel/Packing Baseline.md
Home Timezone: Australia/Melbourne
Home City: Melbourne
Home Currency: AUD
Google Secret: google-places
REST Countries Secret: rest-countries
Map Source Index: 1
Cover Candidates: 3
Nearby Radius km: 150
Holiday Calendars:
  - "TH: en.th"
  - "TW: en.taiwan"
---
Travel module settings. Scripts and templates read these values, so change paths here rather than in code.

- **Module Root** marks which notes belong to this module; **Nav Rules** is the file that builds their breadcrumb (see `98 - Meta/Views/nav.js`).
- **Trip Documents Folder** holds each trip's bookings, insurance and other files in `<folder>/<Trip>/`; link them from an itinerary note's Booking or the trip's Documents.
- **Places Inbox** is where Map View creates new place notes (must match Map View's "New note path" setting).
- **Map Source Index** is the position of MapTiler in Map View's map sources list (0 = first).
- **Nearby Radius km** is how far the "Nearby Cities & Regions" list on a city note reaches.
- **Holiday Calendars** are Google Calendar fallbacks for countries Nager.Date doesn't cover, as `CODE: calendar-id`.
- **Google Secret** and **REST Countries Secret** are Keychain IDs (Settings → Keychain). Keychain doesn't sync, so add them on each device.
