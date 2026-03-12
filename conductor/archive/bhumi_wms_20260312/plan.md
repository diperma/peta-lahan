# Implementation Plan: bhumi_wms_20260312

## Phase 1: CORS Proxy Implementation
- [x] Task: Initialize Express Server
    - [x] Install dependencies: `express`, `cors`, `http-proxy-middleware`.
    - [x] Create `server/index.js` with basic Express setup.
    - [x] Manual verification: Test server response on `http://localhost:3001`.
- [x] Task: Implement WMS Proxy Route
    - [x] Add `/proxy` route to forward requests to `https://bhumi.atrbpn.go.id/map/wms`.
    - [x] Configure `http-proxy-middleware` for streaming BPN requests.
    - [x] Manual verification: Verify CORS headers and WMS GetCapabilities response.

## Phase 2: Leaflet Map Setup
- [x] Task: Initialize Leaflet Map
    - [x] Import Leaflet in `src/main.js` and `src/components/MapView.js`.
    - [x] Create fullscreen map with standard OpenStreetMap base layer.
    - [x] Manual verification: Verify map renders correctly in the browser.
- [x] Task: Implement BPN Layer Integration
    - [x] Define BPN WMS layer in `src/services/wms.js` using the local proxy URL.
    - [x] Add BPN layer to the map in `src/components/MapView.js`.
    - [x] Manual verification: Check that BPN tiles load correctly via the proxy.

## Phase 3: Interactive Features
- [x] Task: Implement Layer Panel
    - [x] Add visibility toggles in `src/components/LayerPanel.js` for different BPN layers.
    - [x] Manual verification: Toggle layers and observe map updates.
- [x] Task: Add GetFeatureInfo Support
    - [x] Implement click listener on the map to trigger BPN `GetFeatureInfo` through the proxy.
    - [x] Display property attributes in a popup or side panel.
    - [x] Manual verification: Clicking on a parcel should show its details.
