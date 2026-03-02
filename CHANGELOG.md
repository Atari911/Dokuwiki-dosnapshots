# Changelog — dosnapshots DokuWiki Plugin

## [1.4.0] - 2026-02-19
### Changed
- Metrics section is now collapsible and collapsed by default
- Metrics data is lazy-loaded — API calls only fire when the section is first expanded
- Toggle bar shows ▶ Show Metrics / ▼ Hide Metrics with slide animation
- Rewrote README.md for GitHub (badges, project structure, contributing guide, security table)

### Added
- `dokuwiki-plugin-page.txt` — ready-to-paste DokuWiki plugin directory page content
- Localization strings: `metrics_show`, `metrics_hide`

## [1.3.1] - 2026-02-19
### Fixed
- Fixed `containerId is not defined` ReferenceError — the container's DOM id was not being captured as a JS variable in `initManager()`, causing metrics canvas IDs and the metrics container selector to fail

## [1.3.0] - 2026-02-19
### Added
- Metrics graphs section with slim sparkline-style charts rendered via HTML5 Canvas
- Five metric cards: CPU Usage, Memory Usage, Bandwidth (in/out), Load Average (1/5/15m), Disk Usage
- Timeframe selector: 6 Hours, 24 Hours, 7 Days, 14 Days
- Backend aggregation endpoint fetches from Digital Ocean Monitoring API (`/v2/monitoring/metrics/droplet/*`)
- CPU metric computed from idle/total delta ratios
- Memory and Filesystem metrics computed from free/total pairs
- Bandwidth displayed as Mbps with rate-of-change calculation
- Load average shows all three intervals with color-coded legend
- Current value displayed in each card header
- Note indicating which metrics require the DO metrics agent
- Full localization for all metric labels, timeframes, and legends

## [1.2.0] - 2026-02-19
### Added
- Open Console button that links to the Digital Ocean web console for the droplet (opens in new tab)
- Localization string for console button

## [1.1.0] - 2026-02-19
### Added
- Reboot Droplet button (visible when droplet is active, alongside Power Off)
- Reboot confirmation dialog
- Backend reboot action handler and API helper method
- Localization strings for reboot feature

## [1.0.1] - 2026-02-19
### Changed
- Changed accent color scheme from blue (#0069ff) to green (#28a745) for header, primary buttons, and spinner

## [1.0.0] - 2026-02-19
### Added
- Initial release
- Syntax plugin: embed snapshot manager with `{{dosnapshots>DROPLET_ID}}` or `{{dosnapshots}}`
- View droplet information (name, status, IP, region, size, image, creation date)
- List all snapshots for a droplet with details (name, ID, size, min disk, created at, regions)
- Create new snapshots with custom or auto-generated names
- Delete snapshots (configurable permission)
- Restore droplet from snapshot / rebuild (configurable permission, with confirmation)
- Power on / power off droplet controls
- AJAX-based UI with no full page reloads
- CSRF protection on all API actions
- Admin configuration: API token, default droplet ID, permission toggles, snapshot name prefix, auth level
- Full English localization with support for additional languages
- HTML entity escaping throughout JS and PHP to prevent XSS
- Safe JSON embedding in HTML data attributes using JSON_HEX_* flags
