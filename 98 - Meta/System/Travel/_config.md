---
Travel Root: 05 - Areas/Travel
Countries Folder: 05 - Areas/Travel/Countries
Locales Folder: 05 - Areas/Travel/Cities & Regions
Places Folder: 05 - Areas/Travel/Places
Trips Folder: 05 - Areas/Travel/Trips
Places Inbox: 06 - Resources/Google Places
Country Images Folder: 06 - Resources/Images/Countries
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
Holiday Calendars:
  - "TH: en.th"
  - "TW: en.taiwan"
---
Travel module settings. Scripts and templates read these values, so change paths here rather than in code.

- **Places Inbox** is where Map View creates new place notes (must match Map View's "New note path" setting).
- **Map Source Index** is the position of MapTiler in Map View's map sources list (0 = first).
- **Holiday Calendars** are Google Calendar fallbacks for countries Nager.Date doesn't cover, as `CODE: calendar-id`.
- **Google Secret** and **REST Countries Secret** are Keychain IDs (Settings → Keychain). Keychain doesn't sync, so add them on each device.
