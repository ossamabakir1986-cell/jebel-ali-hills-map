Hayat Luxury GIS v3.3.42 - Data Update 2026-09-10

Built on v3.3.41 Stable Filter Tabs + Working All Buttons.

Merged latest updated map data export from hayat_gis_updated_map_data_2026-09-10.zip.

Summary:
- Inventory records: 495
- PA label points: 2,963
- Added records: 4
- Removed records: 1
- Updated records: 40
- PA label coordinate updates: 1

GitHub live deployment approach:
- Adds js/v3342_data_update_2026_09_10.js as a compact data patch.
- Admin and Agent loaders now load the data patch before v3.3.41 filter tabs.

Preserved:
- popup/details refresh
- manual GFA allowed override
- dedicated Last Date Updated field and label
- auto date on edit/save
- multi-select filters
- stable filter tabs and working All/Clear buttons
- size/GFA calculations
- agent dropdown/mobile autofill
- PA + Add badges
- Move Plot
- Agent map view-only
