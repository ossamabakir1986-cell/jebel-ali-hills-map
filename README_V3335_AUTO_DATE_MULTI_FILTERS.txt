Hayat Luxury GIS v3.3.35 - Auto Date + Multi-select Filters

Built on v3.3.34 Data Update 2026-09-03.

Changes:
- Last Date Updated now auto-fills to today's date when adding/editing a plot.
- If the field is manually changed, the manual value is preserved on save.
- If the field is empty on save, today's date is inserted automatically.
- Phase filter supports selecting multiple phases.
- Agent filter supports selecting multiple agents, including second-agent values.
- Feature filter supports selecting multiple features.
- Status/color filter supports selecting multiple colors/statuses.

Filter logic:
- Multiple selected values inside the same group are treated as OR.
  Example: Agent A OR Agent B.
- Different filter groups are combined as AND.
  Example: Agent A/B AND Phase 4/5 AND Corner/Single Row.

Deployment note:
- The direct GitHub deployment loads js/v3335_auto_last_updated_multi_filters.js through the existing admin/agent inline loader files, so the live v3.3.34 HTML structure remains intact while v3.3.35 behavior is enabled.

Preserved:
- 493 inventory records.
- 2,963 PA labels.
- Popup/details refresh.
- Manual GFA allowed override.
- Dedicated Last Date Updated field.
- Last Updated display label.
- Size/GFA calculations.
- Agent dropdown/mobile autofill.
- Multiple display labels.
- Gold + Add PA badges.
- Feature and bulk feature editing.
- Move Plot.
- Fast filters.
- Agent map view-only.
- Cleaned master plan overlay.
