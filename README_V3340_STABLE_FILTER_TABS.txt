Hayat Luxury GIS v3.3.40 - Stable Filter Tabs

Built after v3.3.39 when the filter tabs were still dancing / opening and closing incorrectly.

Main fix:
- Stop loading the stacked v3.3.35, v3.3.36, v3.3.37, v3.3.38, and v3.3.39 filter UI patches from admin_inline_2.js and agent_inline_2.js.
- Load one stable v3.3.40 filter controller instead.
- Hide and remove old custom filter fragments if they were already created by cached scripts.
- Keep the full tab clickable, including the arrow area.
- Dropdowns do not rebuild while open, so they should no longer jump/dance.

Tab layout preserved:
- All agents
- All statuses + All types
- All features
- All phases + All GFA
- All pricing

Preserved from previous updates:
- v3.3.34 data update.
- Popup/details refresh.
- Manual GFA allowed override.
- Dedicated Last Date Updated field.
- Last Updated display label.
- Auto Last Date Updated when editing/saving.
- Multi-select filters.
- Size/GFA calculations.
- Agent map view-only.
