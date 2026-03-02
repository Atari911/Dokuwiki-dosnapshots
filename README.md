# dosnapshots — Digital Ocean Snapshot Manager for DokuWiki

[![Version](https://img.shields.io/badge/version-1.4.0-28a745.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-GPL--2.0-blue.svg)](https://www.gnu.org/licenses/gpl-2.0.html)
[![DokuWiki](https://img.shields.io/badge/DokuWiki-Greebo%2B-orange.svg)](https://www.dokuwiki.org)

Manage Digital Ocean droplet snapshots directly from your DokuWiki pages. View droplet status, create/delete/restore snapshots, monitor performance metrics, and control droplet power state — all without leaving the wiki.

---

## Features

- **Droplet Info Panel** — Name, status, IP, region, size, image, and creation date at a glance
- **Snapshot Management** — List, create, delete, and restore snapshots with confirmation dialogs
- **Metrics Graphs** — Collapsible sparkline charts for CPU, Memory, Bandwidth, Load Average, and Disk Usage with selectable timeframes (6h / 24h / 7d / 14d). Lazy-loaded on first expand to avoid unnecessary API calls
- **Power Controls** — Power on, power off, and reboot your droplet, plus a direct link to the DO web console
- **Permission System** — Configurable minimum auth level (admin / manager / user)
- **Safety Guards** — Restore and delete can be independently enabled or disabled; confirmation dialogs on all destructive actions
- **CSRF Protection** — All AJAX calls validated with DokuWiki security tokens
- **Localization Ready** — Full English language file included; drop in your own `lang/<code>/lang.php`
- **XSS Protected** — All dynamic content escaped in both PHP and JavaScript
- **Zero External Dependencies** — Metrics charts rendered with HTML5 Canvas; no charting libraries required

## Screenshots

<!-- Add screenshots to a screenshots/ directory and uncomment these: -->
<!-- ![Snapshot Manager](screenshots/snapshot-manager.png) -->
<!-- ![Metrics Panel](screenshots/metrics-panel.png) -->

## Requirements

- **DokuWiki** Greebo or later (tested on Kaos)
- **PHP** 7.0+ with the cURL extension
- **Digital Ocean API Token** with read and write scope ([generate one here](https://cloud.digitalocean.com/account/api/tokens))
- **DO Metrics Agent** *(optional)* — required for Memory, Load Average, and Disk Usage graphs ([install instructions](https://docs.digitalocean.com/products/monitoring/how-to/install-metrics-agent/))

## Installation

### Manual

1. Download the [latest release](../../releases/latest) or clone this repo.
2. Copy the `dosnapshots` folder into your DokuWiki `lib/plugins/` directory.
3. Clear DokuWiki's cache: **Admin → Site Configuration → Save** (or delete `data/cache/`).

### DokuWiki Extension Manager

Search for **dosnapshots** in the Extension Manager, or paste the download URL.

### Verify

Navigate to **Admin → Manage Plugins** and confirm `dosnapshots` appears in the list.

## Configuration

Go to **Admin → Configuration Settings** and search for `dosnapshots`.

| Setting | Description | Default |
|---|---|---|
| `api_token` | Digital Ocean Personal Access Token (stored as password field) | *(empty)* |
| `default_droplet_id` | Fallback droplet ID when none specified in syntax | *(empty)* |
| `allow_restore` | Enable the Restore button (rebuilds the droplet!) | `Off` |
| `allow_delete` | Enable the Delete button for snapshots | `On` |
| `snapshot_prefix` | Prefix for auto-generated snapshot names | `wiki-snap-` |
| `min_auth_level` | Minimum DokuWiki auth level: `admin`, `manager`, or `user` | `admin` |

## Usage

### Basic Syntax

Embed the snapshot manager on any wiki page:

```
{{dosnapshots>12345678}}
```

Where `12345678` is your Digital Ocean droplet ID (find it in the DO control panel URL or via `doctl compute droplet list`).

### Default Droplet

If you set a **Default Droplet ID** in admin config, you can use the shorthand:

```
{{dosnapshots}}
```

### Multiple Droplets

Embed managers for different droplets on the same page:

```
=== Production Server ===
{{dosnapshots>11111111}}

=== Staging Server ===
{{dosnapshots>22222222}}
```

## Localization

All user-facing strings are defined in `lang/en/lang.php` and `lang/en/settings.php`.

To add a new language:

1. Create `lang/<code>/lang.php` (copy from `lang/en/lang.php`)
2. Create `lang/<code>/settings.php` (copy from `lang/en/settings.php`)
3. Translate all `$lang[...]` values

DokuWiki will automatically use the correct language file based on the user's locale setting.

## Security

| Concern | Mitigation |
|---|---|
| API token storage | DokuWiki `password` config type (not visible in settings form) |
| CSRF | All AJAX requests include DokuWiki's `sectok` token |
| Input validation | Droplet and snapshot IDs validated as numeric-only |
| Snapshot names | Sanitized to `[a-zA-Z0-9._-]` only |
| XSS (PHP) | `hsc()` for HTML output; `JSON_HEX_*` flags for JSON in attributes |
| XSS (JS) | DOM-based `escHtml()` for all dynamic content injection |

## Project Structure

```
dosnapshots/
├── action.php            # AJAX request handler
├── conf/
│   ├── default.php       # Default configuration values
│   └── metadata.php      # Configuration field types
├── helper.php            # Digital Ocean API v2 client
├── lang/
│   └── en/
│       ├── lang.php      # UI strings
│       └── settings.php  # Admin settings labels
├── plugin.info.txt       # DokuWiki plugin metadata
├── script.js             # Frontend JS (AJAX, canvas charts, UI)
├── style.css             # Plugin styles
├── syntax.php            # Syntax plugin (wiki page embedding)
├── CHANGELOG.md
├── README.md
└── dokuwiki-plugin-page.txt  # Copy-paste for DokuWiki plugin directory
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

Please ensure any new user-facing strings are added to the language file and that all dynamic output is properly escaped.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a full history of changes.

## License

This plugin is licensed under the [GNU General Public License v2.0](https://www.gnu.org/licenses/gpl-2.0.html).

## Credits

- Built for integration with the [Digital Ocean API v2](https://docs.digitalocean.com/reference/api/)
- Designed for the [DokuWiki](https://www.dokuwiki.org) plugin framework

---

**Version 1.4.0** · [Report an Issue](../../issues) · [Request a Feature](../../issues/new)
