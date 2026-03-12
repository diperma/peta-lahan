# Specification: Building Progress vs Agricultural Land Comparison

## Overview
This track implements a feature to compare building progress markers from the `peta-gudang` API with the current agricultural land layers (Lahan Sawah Desa and Lahan Baku Sawah). The goal is to identify and count markers that overlap with these land parcels, particularly focusing on those with 100% building progress.

## Functional Requirements
- **Data Integration:**
    - Fetch marker data from `peta-gudang` API.
    - Requests are proxied via the `bhumi-scraper` backend.
- **Comparison Logic:**
    - Perform point-in-polygon analysis to determine if a marker overlaps with land parcel geometries.
    - Categorize overlaps by building progress.
- **Visualization:**
    - Render `peta-gudang` markers as a new map layer.
    - Highlight overlapping land parcels.
    - Display a statistics panel with overlap counts (total and by progress level).

## Non-Functional Requirements
- **Performance:** Handle up to 1000 markers efficiently.
- **Maintainability:** Modular UI and data services.

## Acceptance Criteria
- Toggleable markers layer.
- Statistics panel shows correct overlap counts.
- Overlapping land parcels are visually highlighted.
- 100% progress overlaps are clearly identified in stats.

## Out of Scope
- Editing `peta-gudang` data.
- Comparison with other land layers.
