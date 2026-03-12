# Product Definition: bhumi-scraper (Peta Lahan Sawah Indonesia)

## Overview
A web-based tool for visualizing and scraping geographic information from the **Bhumi ATR/BPN** (Indonesia's National Land Agency) system. Specifically, it focuses on identifying and visualizing agricultural land parcels (Lahan Sawah).

## Core Goals
1. **Bypass CORS**: Provide a robust proxy server for bhumi.atrbpn.go.id WMS services.
2. **Parcel Visualization**: Render high-resolution map tiles of land parcels using Leaflet.
3. **Data Access**: Enable users to view property attributes (FeatureInfo) and legends.
4. **Performance**: Efficient tile proxying with high concurrency support.
5. **Building Progress Comparison**: Compare peta-gudang marker data with agricultural land parcels to identify overlaps.

## Key Features
- **Map View**: Full-screen interactive map powered by Leaflet.
- **Layer Panel**: Toggle visibility of various BPN WMS layers.
- **Attribute Info**: Clicking on a parcel fetches property details from the BPN API.
- **Proxy Server**: Node.js/Express server to handle authentication and CORS for BPN requests.
- **Building Progress Analysis**: Fetch and render marker data from the peta-gudang API.
- **Overlap Visualization**: Manually check and highlight overlapping land parcels for each marker.
- **Statistics Dashboard**: Summary counts of markers by building progress.
