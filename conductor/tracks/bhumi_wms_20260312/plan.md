# Implementation Plan: bhumi_wms_20260312

## Phase 1: CORS Proxy Implementation
- [ ] Task: Initialize Express Server
    - [ ] Install dependencies: `express`, `cors`, `http-proxy-middleware`.
    - [ ] Create `server/index.js` with basic Express setup.
    - [ ] Manual verification: Test server response on `http://localhost:3001`.
- [ ] Task: Implement WMS Proxy Route
    - [ ] Add `/proxy` route to forward requests to `https://bhumi.atrbpn.go.id/map/wms`.
    - [ ] Configure `http-proxy-middleware` for streaming BPN requests.
    - [ ] Manual verification: Verify CORS headers and WMS GetCapabilities response.

## Phase 2: Leaflet Map Setup
- [ ] Task: Initialize Leaflet Map
    - [ ] Import Leaflet in `src/main.js` and `src/components/MapView.js`.
    - [ ] Create fullscreen map with standard OpenStreetMap base layer.
    - [ ] Manual verification: Verify map renders correctly in the browser.
- [ ] Task: Implement BPN Layer Integration
    - [ ] Define BPN WMS layer in `src/services/wms.js` using the local proxy URL.
    - [ ] Add BPN layer to the map in `src/components/MapView.js`.
    - [ ] Manual verification: Check that BPN tiles load correctly via the proxy.

## Phase 3: Interactive Features
- [ ] Task: Implement Layer Panel
    - [ ] Add visibility toggles in `src/components/LayerPanel.js` for different BPN layers.
    - [ ] Manual verification: Toggle layers and observe map updates.
- [ ] Task: Add GetFeatureInfo Support
    - [ ] Implement click listener on the map to trigger BPN `GetFeatureInfo` through the proxy.
    - [ ] Display property attributes in a popup or side panel.
    - [ ] Manual verification: Clicking on a parcel should show its details.
