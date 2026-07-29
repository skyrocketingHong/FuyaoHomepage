<p align="center">
  English | <a href="README_ZH.md">简体中文</a>
</p>

<p align="center">
  <img src="https://fuyaoskyrocket.ing/favicon/android-chrome-512x512.png" alt="Fuyao Homepage icon" width="128">
</p>

<h1 align="center">Fuyao Homepage</h1>

<p align="center">
  <a href="https://github.com/skyrocketingHong/FuyaoHomepage/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/skyrocketingHong/FuyaoHomepage/ci.yml?branch=main&amp;label=CI" alt="CI status"></a>
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&amp;logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=nodedotjs&amp;logoColor=white" alt="Node.js 22 or later">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="AGPL-3.0 license"></a>
</p>

Fuyao Homepage is a static personal homepage and content site built with SvelteKit, Svelte 5, and TypeScript. It combines a profile dashboard, blog, travel footprint, photo albums, friend links, and a support page with responsive navigation, bilingual content, Markdown processing, external production data, and rollback-safe static deployment.

The public repository contains source code, baseline public assets, configuration samples, and demonstration content. Real site configuration, articles, travel data, albums, and server-side secrets can remain outside the repository, so development and continuous integration never depend on personal production data.

## Highlights

- Provides six primary destinations: home, blog, footprint, albums, friends, and support, with layouts optimized separately for desktop and mobile.
- Uses Svelte 5 Runes, TypeScript, and Tailwind CSS 4, with complete light and dark theme support.
- Includes English and Simplified Chinese interfaces with crossfade transitions during locale changes.
- Offers flowing gradients, Hong Kong MTR mosaics, Bing daily wallpapers, and solid backgrounds with layered image-failure fallbacks.
- Uses a Liquid Glass component system and a shared WebGL compositor, falling back to CSS or static materials when required.
- Generates blog listings, categories, tags, full-text search, RSS, Sitemap, and static article pages from Markdown, with GFM, math, syntax highlighting, and table-of-contents support.
- Organizes albums from EXIF metadata, generates responsive WebP thumbnails and yearly indexes, and serves originals and thumbnails through stable external media paths.
- Displays travel footprints with AMap, including city and place lists, place search, and YAML generation tools.
- Displays analytics and coding activity through public proxy endpoints without exposing API tokens to the browser.
- Manages site settings and content paths with versioned YAML schemas; production builds reject placeholders, unknown fields, out-of-root paths, and secret fields.
- Isolates source, production content, and generated files through read-only build-input snapshots, preventing builds from modifying authoritative content.
- Includes privacy audits, automated tests, immutable releases, health checks, atomic switching, and failure rollback.

## Technology

| Area               | Main technologies                                                   |
| :----------------- | :------------------------------------------------------------------ |
| Application        | SvelteKit, Svelte 5, Vite                                           |
| Languages          | TypeScript, JavaScript                                              |
| Styling and UI     | Tailwind CSS 4, Tailwind Variants, Lucide, Simple Icons             |
| Content processing | Unified, Remark, Rehype, Gray Matter, KaTeX, Highlight.js           |
| Search             | Fuse.js                                                             |
| Image processing   | Sharp, Exifr                                                        |
| Configuration      | YAML, versioned schemas, build-time allowlist validation            |
| Output             | `adapter-static`, prerendered pages, external album media           |
| Quality            | Svelte Check, ESLint, Prettier, Node.js Test Runner, GitHub Actions |

## Requirements

Development and demonstration builds require:

- Node.js 22 or later
- npm, with dependency versions locked by `package-lock.json`
- A browser with WebGL2, CSS Mask, and modern `backdrop-filter` support; unsupported effects degrade to fallback materials

Production deployments may use Linux, systemd, and Caddy. The static build itself does not require a database or a build process running on the web server.

## Quick Start

```bash
git clone https://github.com/skyrocketingHong/FuyaoHomepage.git
cd FuyaoHomepage
npm ci
npm run dev
```

The development server uses the public samples in `config/*.example.yaml` and `fixtures/content/`. Open the local URL printed by Vite; no production configuration or personal content is required.

Create and preview a demonstration build:

```bash
npm run build
npm run preview
```

The output is written to `build/`. `npm run build` uses public fixtures and is suitable for local verification and CI; it does not validate production configuration.

## Configuration and Content

### Development and CI

Development uses versioned public inputs from the repository:

```text
config/
├── site.example.yaml       # Public site-configuration sample
└── content.example.yaml    # Content-path mapping sample

fixtures/content/
├── posts/                  # Demonstration articles
├── data/                   # Footprint, friend, payment, and social data
└── albums/                 # Demonstration metadata and empty media directories
```

These files support development, tests, and CI. Do not replace them with real production data.

### Production

Production builds require at least three external input directories:

| Variable             | Contents                                            |
| :------------------- | :-------------------------------------------------- |
| `FUYAO_CONFIG_ROOT`  | Directory containing `site.yaml` and `content.yaml` |
| `FUYAO_CONTENT_ROOT` | Persistent root for articles, data, and albums      |
| `FUYAO_FAVICON_ROOT` | Production favicon directory                        |

The deployment templates use `/srv/fuyao` as an example root, including `/srv/fuyao/shared/config/`. This path is neither generated automatically nor required by SvelteKit. When using another location, update every relevant `FUYAO_*` variable and the systemd and Caddy templates.

Every `VITE_*` value is browser-visible. Fuyao Homepage does not store secrets in `VITE_*` variables. Tokens for services such as Cloudflare and WakaTime belong in a separate proxy or secret-management system; `site.yaml` contains only public proxy URLs with no embedded credentials.

See [CONFIGURATION.md](./CONFIGURATION.md) for the complete schema, paths, secret boundaries, and production-build workflow. Upgrades from 3.0.0 should begin with [MIGRATION_3_TO_27.md](./MIGRATION_3_TO_27.md).

## Commands

| Command                    | Purpose                                                        |
| :------------------------- | :------------------------------------------------------------- |
| `npm run dev`              | Start the development server with public samples and fixtures  |
| `npm run check`            | Run Svelte and TypeScript static checks                        |
| `npm test`                 | Run the Node.js automated test suite                           |
| `npm run lint`             | Check Prettier formatting and ESLint rules                     |
| `npm run format`           | Format project files                                           |
| `npm run build`            | Build and validate the public demonstration site               |
| `npm run build:production` | Build from external production inputs and scan the result      |
| `npm run preview`          | Preview an existing static build locally                       |
| `npm run gen-blog`         | Prepare development content and regenerate blog indexes        |
| `npm run gen-album:import` | Import photos and generate thumbnails and album metadata       |
| `npm run gen-album:public` | Generate public album metadata with GPS removed                |
| `npm run watch:content`    | Watch production article and album directories                 |
| `npm run audit:privacy`    | Audit current and staged files for privacy and secret exposure |
| `npm run audit:history`    | Audit the complete Git history                                 |
| `npm run version:show`     | Show the version, Build Train, and build identifier            |

## Build and Verification

Run the following checks before submitting changes:

```bash
npm run audit:privacy
npm run check
npm run lint
npm test
npm run build
```

GitHub Actions runs the same checks for pushes to `main` and for pull requests. The build validates blog indexes, Sitemap, RSS, favicons, album metadata, public file permissions, and final artifacts. It fails if secrets or server-only absolute paths are present.

Build from production inputs with:

```bash
export FUYAO_CONFIG_ROOT=/path/to/config
export FUYAO_CONTENT_ROOT=/path/to/content
export FUYAO_FAVICON_ROOT=/path/to/favicon
export FUYAO_DEPLOY_LOCK="$PWD/.fuyao/production-build.lock"
npm run build:production
```

`build:production` prepares and validates production inputs before running the static build and final artifact scan. To validate only the inputs, run `npm run inputs:prepare:production`. Production mode never falls back to demonstration data when an input is missing.

## Architecture and Data Flow

```text
Public source             External production inputs
     │          ┌────────────┼─────────────┐
     │       site.yaml    content/      favicon/
     │          └────────────┼─────────────┘
     └───────────────┐       │
                     ▼       ▼
             prepare-build-inputs
                     │
        Read-only .fuyao/ input snapshot
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
     Blog/album indexes    SvelteKit prerender
          └──────────┬──────────┘
                     ▼
                  build/
                     │
        Immutable release + optional health check
                     │
                     ▼
             Atomic current switch

External album originals and thumbnails ─── Caddy /media/albums/*
```

Configuration, content, and secrets remain in persistent storage such as `shared/`; every static build produces an independent release. A code rollback only switches `current` and does not delete or restore persistent content.

## Deployment Automation

The repository includes the following production scripts and templates:

- `scripts/deploy.js` acquires the deployment lock, reads or clones source, validates production inputs, builds an independent release, switches `current`, and performs an optional health check.
- `scripts/watch-content.js` recursively watches article and album directories and coalesces rapid file events.
- `scripts/prepare-content-update.js` prepares albums, thumbnails, and metadata on a low-memory server and records pending deployment state without running Vite.
- `deploy/systemd/` contains deployment and content-watcher service templates.
- `deploy/caddy/` contains routing templates for static releases and external album media.

The provided content-watcher service uses `prepare` mode by default. The server prepares content and records pending changes, while a separate release workflow performs the final production build and deployment. This avoids prerendering on memory-constrained hosts. On a sufficiently provisioned host with complete variables, the watcher can also invoke the deployment script directly.

Adapt the templates to the actual server paths, service accounts, domain, and secret-management method before installation. See [CONFIGURATION.md](./CONFIGURATION.md) for the full workflow, variable reference, Caddy mapping, and rollback procedure.

## Project Layout

```text
config/                    Public YAML configuration samples
deploy/                    systemd and Caddy production templates
fixtures/content/          Public demonstration content for development and CI
scripts/                   Content, migration, audit, version, and deployment tools
src/lib/components/        Page components and shared UI components
src/lib/config/            Schemas, server loaders, and the browser-safe public interface
src/lib/i18n/              English and Simplified Chinese locale resources
src/lib/styles/            Global, theme, and reader styles
src/routes/                SvelteKit pages and routes
static/                    Public fonts, favicons, and baseline static files
tests/                     Automated tests and build acceptance checks
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the complete tree and module responsibilities.

## Data and Privacy

- Production configuration, articles, footprints, friend links, payment data, and albums are excluded from the public repository by default.
- `site.yaml` is browser-visible public configuration and must not contain tokens, passwords, private keys, or webhook secrets.
- Public album metadata may contain EXIF GPS coordinates. Use `npm run gen-album:public` to remove coordinates before publishing a sanitized dataset.
- `audit:privacy` checks current files, while `audit:history` checks Git history. Removing a secret from the latest commit does not invalidate earlier copies; exposed credentials must still be rotated.
- Releases contain no links to `shared/`, and persistent content must never be deleted with a code release.

## Versions and Documentation

`version.json` is the only manually maintained source for the version, Build Train, and build sequence. Release changes are recorded in [CHANGELOG.md](./CHANGELOG.md).

| Document                                       | Contents                                                                           |
| :--------------------------------------------- | :--------------------------------------------------------------------------------- |
| [CONFIGURATION.md](./CONFIGURATION.md)         | Configuration schema, environment variables, content paths, builds, and deployment |
| [MIGRATION_3_TO_27.md](./MIGRATION_3_TO_27.md) | Migrating configuration and content from 3.0.0 to 27.0                             |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete project tree and module responsibilities                                  |
| [CHANGELOG.md](./CHANGELOG.md)                 | Release history                                                                    |

## Acknowledgements

- [imyan.ren](https://github.com/Yanren1225/imyan.ren) informed early visual and interaction design.
- [hongkong-mtr-mosaic](https://github.com/sayidhe/hongkong-mtr-mosaic) inspired the Hong Kong MTR mosaic background.
- [MTR-Sung](https://github.com/wobebebe/MTR-Sung) provides the MTR-inspired typeface reference.

## License

Fuyao Homepage is licensed under the [GNU Affero General Public License v3.0](./LICENSE). Operators who make modified versions available over a network must comply with the corresponding-source obligations of AGPL-3.0.
