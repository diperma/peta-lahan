# Specification: bhumi_wms_20260312

## Track ID
bhumi_wms_20260312

## Description
Implement a full-screen interactive map powered by Leaflet that displays BPN WMS layers via a dedicated Node.js proxy server to bypass CORS restrictions.

## Scope
- Implement a streaming CORS proxy in Express.js.
- Configure Leaflet to display BPN WMS layers.
- Add basic layer controls (visibility toggling).
- Support for `GetFeatureInfo` requests via the proxy.

## Success Criteria
- Map displays BPN WMS layers without CORS errors.
- Clicking on the map displays attribute info for the clicked parcel.
- Proxy server handles high concurrency for tile requests.
