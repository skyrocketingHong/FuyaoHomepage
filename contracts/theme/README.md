English | [简体中文](./README_ZH.md)

# Theme Contract (v1)

Authoritative, machine-checkable contracts that decouple the public site from the content platform. A theme declares what it consumes and produces; the platform decides whether a site's needs are covered before any build, preview, or publication runs. The contracts are JSON Schema (draft 2020-12) documents validated by the Go package `backend/internal/themecontract`.

Scope boundary: `contracts/openapi/management.yaml` governs the management HTTP API (transport, auth, errors). This directory governs the build-time theme contract (identity, inputs, outputs). HTTP surface changes land in the OpenAPI file as the backend phases implement them; the theme contract never describes HTTP endpoints.

## Documents

| Document                  | Validates                      | Consumed by                                       |
| :------------------------ | :----------------------------- | :------------------------------------------------ |
| `manifest.schema.json`    | Theme root `theme.json`        | Platform theme registry, build orchestration      |
| `build-input.schema.json` | Snapshot `private/input.json`  | Input preparation (T2), build executor (T3)       |
| `release.schema.json`     | Release root `release.json`    | Publication verification, web-server health check |
| `examples/`               | Positive and negative fixtures | `go test ./internal/themecontract ./internal/cli` |

All fixtures are public demonstration data with no private content, credentials, or real site values.

## Theme manifest

A theme root contains `theme.json` plus its sources and, when configured, a theme configuration schema. Key fields:

| Field                       | Rule                                                                                                                                                           |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `contract`                  | Constant `fuyao.theme.manifest/v1`; self-identifies the schema version.                                                                                        |
| `id` / `version`            | Lowercase kebab-case id (3 to 63 chars) and SemVer 2.0.0 version. The first theme is `fuyao-homepage`.                                                         |
| `adapter`                   | Enumerated trusted build adapter. v1 ships `node22-sveltekit-static` only. Never a command, script, or URL.                                                    |
| `inputProtocol`             | Input snapshot protocol the theme consumes; v1: `fuyao.theme.build-input/v1`.                                                                                  |
| `capabilities`              | Non-empty unique set of content domains (see below).                                                                                                           |
| `configSchema`              | Optional. `file` is a traversal-free relative path to a draft 2020-12 JSON Schema describing valid `themeConfig` values. Absent means only `{}` is valid.      |
| `outputs.spaFallback`       | SPA fallback page inside the release (for example `200.html`) or `null`. Not every theme needs one.                                                            |
| `outputs.urlConventions`    | Non-empty unique set of site URL conventions honored (see below).                                                                                              |
| `outputs.requiredArtifacts` | Files that must exist in every release; the platform verifies them before switching traffic. `release.json` is written by the platform and must not be listed. |

Unknown fields at any level are rejected (`additionalProperties: false`).

### Capability enum

| Capability  | Meaning                                                                    |
| :---------- | :------------------------------------------------------------------------- |
| `blog`      | Articles, categories, tags, search, and RSS from the `posts` input.        |
| `albums`    | Photo albums from album metadata plus external media under the album base. |
| `footprint` | Footprint map from `data` inputs and the map service configuration.        |
| `friends`   | Friend links from `data` inputs.                                           |
| `pay`       | Support and payment page from `data` inputs.                               |
| `favicon`   | Site favicon set from the `favicon` input.                                 |

### URL convention enum

| Convention     | Meaning                                                                         |
| :------------- | :------------------------------------------------------------------------------ |
| `release.json` | The release metadata file at the site root, used by health checks and rollback. |
| `posts`        | Article files under `/posts/` served from persistent content by the web server. |
| `data`         | Shared data files under `/data/`.                                               |
| `media-albums` | Album media under the configured public album base (`/media/albums`).           |
| `sitemap`      | `/sitemap.xml`.                                                                 |
| `blog-rss`     | `/blog/rss.xml`.                                                                |
| `blog-search`  | The blog search index consumed by the theme's search UI.                        |

Compatibility rule: when a site requires a capability or URL convention the theme does not declare, the platform lists every missing item and blocks publication. Pages are never silently hidden and no 301 or 410 responses are generated on the theme's behalf.

## Build-input snapshot

The platform freezes a read-only snapshot before any theme build; adapters must not write into it and builds run without management keys or database connections.

Frozen consumption (`prepare-build-inputs.js --frozen=<snapshot>` / `FUYAO_FROZEN_INPUT`) verifies the snapshot read-only and must be given an independent directory: a frozen root that intersects any rebuildable work directory (`site/.fuyao/`, `site/build/`) is rejected before any cleanup, since later work-dir deletion would destroy the input.

```text
<snapshot-root>
├── public/                 # World-readable inputs (web-server readable)
│   ├── favicon/            # Site favicon set
│   ├── fonts/              # Optional public fonts
│   ├── robots.txt          # Optional crawler directives
│   ├── posts/              # Articles plus generated indexes (all.json, search.json, ...)
│   ├── data/               # Footprint, friends, payment, and social data
│   └── albums/             # Album metadata (index.json, per-album metadata)
└── private/                # Adapter-private, mode 0600
    ├── site-config.json    # Normalized public site configuration
    ├── content-config.json # Content path and media mapping
    └── input.json          # Metadata validated by build-input.schema.json
```

`input.json` records `preparedAt`, `mode` (`ci`, `development`, `preview`, `production`), the `theme` (`id`, `version`) the snapshot is prepared for, the optional `themeConfig` values, and `inputs` digests. The three digests (`contentDigest`, `siteConfigDigest`, `themeConfigDigest`) version the three independently managed inputs: platform content, site configuration, and theme configuration.

Digest algorithm (normative; the reference implementation is `computeContentDigest` in `site/scripts/lib/theme-input.js`): each entry feeds SHA-256 as `u8(domain) + u32be(labelUtf8Length) + label + u64be(contentLength) + content`. Domain 1 covers regular files under `public/` with their snapshot-relative paths; domain 2 covers private files that version the content mapping (currently `content-config.json`) with labels `private/<basename>`. Entries are sorted by label in UTF-8 byte order within each domain, public entries first. The length prefixes make file boundaries unforgeivable. `siteConfigDigest` is the SHA-256 of the `private/site-config.json` file bytes; `themeConfigDigest` is the SHA-256 of the `themeConfig` object serialized with recursively sorted keys (an absent config equals the empty object).

## Release metadata

Every release directory root carries `release.json`, validated by `release.schema.json`. It keeps the legacy fields `schemaVersion` (constant 1), `releaseId`, `createdAt`, and `reasons` so existing web-server health checks keep working, and adds:

- `theme`: `id`, `version`, and `manifestDigest` (digest of the exact `theme.json` used).
- `inputs`: the same three digests recorded in the snapshot, enabling per-site rollback to an exact content, theme, and configuration triple.
- `routes`: `spaFallback` and `urlConventions` mirrored from the manifest for the release.

## Security model

- Adapters are enumerated, platform-built execution units. A manifest cannot request arbitrary shell commands, scripts, or theme delivery from arbitrary Git repositories.
- All manifest paths are traversal-free relative paths (no absolute paths, no `..` segments, no backslashes, no trailing slashes); the Go validator and CLI add a defense-in-depth containment check.
- Theme configuration schemas must declare draft 2020-12; other dialects are rejected before compilation.
- Contract files and fixtures contain no secrets; the repository privacy audit covers this directory.

## Versioning

Each schema version is identified by its `contract` constant (or the legacy `schemaVersion` for `release.json`). Within v1, additive changes (new optional fields, new enum values) keep the constant; breaking changes introduce a v2 constant and a compatibility window so existing themes keep publishing during migration.

## Validation

```bash
# Unit and fixture tests (positive and negative, no database needed)
cd backend && go test ./internal/themecontract/ ./internal/cli/

# Validate a theme root from the command line (flags must precede the root)
cd backend && go run ./cmd/fuyao-admin validate-theme \
  --contracts ../../contracts/theme [--config <theme-config.json>] <theme-root>
```
