English | [简体中文](./CONFIGURATION_ZH.md)

# Configuration and Deployment

## 1. Data Boundaries

| Layer                     | Authoritative source                             | Stored in public repository | Included in browser artifacts                        |
| :------------------------ | :----------------------------------------------- | :-------------------------- | :--------------------------------------------------- |
| Public source             | GitHub `main`                                    | Yes                         | According to frontend bundling rules                 |
| Public site configuration | `shared/config/site.yaml`                        | Only `site.example.yaml`    | Schema-allowlisted fields only                       |
| Public root assets        | `shared/legacy/root-assets/favicon/`             | No                          | Copied to `/favicon/`                                |
| Private content           | `shared/content/`                                | No                          | Generated pages, public indexes, and media URLs only |
| Server secrets            | `shared/secrets/secrets.env` or a secret manager | No                          | No                                                   |

Treat every `VITE_*` value as browser-visible. Fuyao Homepage no longer uses `VITE_*` for site configuration, content paths, or secrets.

Public fields from the former `.env` now live in `config/site.example.yaml`. Demonstration files from the former `static/data` and `static/posts` directories now live in `fixtures/content/`. Development and CI use these migrated public samples; production builds read only external YAML and content directories.

## 2. Server Layout

The `/srv/fuyao` tree below is the example root used by this repository's deployment templates. It is not created automatically after checkout and is not required by SvelteKit. A server administrator must create it. When using another root, update the relevant `FUYAO_*` variables and every matching path in the systemd and Caddy configuration.

```text
/srv/fuyao/
├── shared/
│   ├── config/
│   │   ├── site.yaml
│   │   └── content.yaml
│   ├── secrets/
│   │   └── secrets.env
│   ├── legacy/
│   │   └── root-assets/
│   │       └── favicon/
│   └── content/
│       ├── posts/
│       ├── data/
│       └── albums/
│           ├── photos/
│           ├── thumbnails/
│           └── metadata/
├── tooling/
│   ├── releases/<tooling-id>/
│   └── current -> releases/<tooling-id>
├── releases/<release-id>/
└── current -> releases/<release-id>
```

- Treat `shared` as the persistent source of truth for configuration and content, and back it up independently.
- Keep each `release` read-only and free of symbolic links into `shared`.
- Configure the web server to map `/media/albums/photos/` and `/media/albums/thumbnails/` to persistent media directories.
- Never apply `rsync --delete`, recursive cleanup, or release deletion to `shared`.

## 3. Public Site Configuration

Use [config/site.example.yaml](./config/site.example.yaml) as the field template. The current `schemaVersion` is `1`.

- `site`: site name, canonical URL, operating dates, and default locale
- `profile`: public name, birth date, optional public email, avatar, bilingual roles, and quotes
- `repository`: public repository name, URL, and owner
- `seo`: author, description, keywords, and optional Twitter ID
- `services.wallpaper.apiUrl`: the daily wallpaper image endpoint. The default endpoint, `https://api.imyan.ren/bing/wallpaper`, returns raw `image/jpeg` data rather than a text URL, so the frontend must not parse the response as text. Desktop, tablet, and landscape layouts use the default `1920×1080` image. Portrait mobile layouts narrower than `768px` add `type=mini` with `URL.searchParams` and request a `768×1366` image.
- `services.wallpaper.defaultUrl`: a local or remote fallback image used only when the Bing endpoint fails. It is not the primary daily image. If this fallback also fails, the page uses the global solid theme background.
- `services.amap`: browser key, security code, and optional proxy address; configure an origin allowlist and minimum permissions.
- `services.*ProxyUrl`: public analytics and coding-activity proxy URLs with no embedded secrets.

Production validation rejects unknown or duplicate fields, incorrect types, invalid URLs, invalid dates, invalid email addresses, unsupported locale codes, secret fields, empty required values, and example placeholders.

Coding statistics use two optional public endpoints: `codingActivityProxyUrl` returns daily activity, while `codingLanguagesProxyUrl` returns the aggregate seven-day language distribution. The daily endpoint must preserve real per-day language seconds:

```json
{
	"data": [
		{
			"range": { "date": "2026-07-28", "text": "Today" },
			"grand_total": { "hours": 1, "minutes": 30, "total_seconds": 5400, "text": "1 hr 30 mins" },
			"languages": [
				{ "name": "Svelte", "total_seconds": 3600, "percent": 66.67, "color": "#ff3e00" },
				{ "name": "TypeScript", "total_seconds": 1800, "percent": 33.33, "color": "#3178c6" }
			]
		}
	]
}
```

- Map `languages[].total_seconds` and `percent` directly from each WakaTime daily summary. Do not copy the seven-day aggregate percentages into every day.
- When only daily `grand_total` values are available, the frontend renders neutral daily bars and displays the seven-day distribution from `codingLanguagesProxyUrl` in a separate segmented bar.
- `color` accepts valid hexadecimal colors only. When it is missing, the frontend uses its built-in language color and then falls back to a neutral “Other” category.
- Keep the WakaTime API key only in the proxy service's secret store. Neither browser URL may contain keys or signed parameters.

## 4. Content-Path Mapping

Use [config/content.example.yaml](./config/content.example.yaml) as the template. Every value under `paths` is relative to `FUYAO_CONTENT_ROOT`; absolute paths are not allowed. The build resolves each path with `realpath` and rejects symbolic links or paths that escape the content root.

Album media uses `external` mode. Metadata enters the build snapshot, while originals and thumbnails remain outside the Git repository and release.

## 5. Server Variables and Secrets

`.env.example` lists only routine, non-secret deployment parameters. Production builds, deployments, migrations, and content services support the following external variables:

| Variable                      | Required for                                     | Purpose                                                        |
| :---------------------------- | :----------------------------------------------- | :------------------------------------------------------------- |
| `FUYAO_CONFIG_ROOT`           | Production build, deployment                     | Directory containing external `site.yaml` and `content.yaml`   |
| `FUYAO_CONTENT_ROOT`          | Production build, migration, content preparation | Persistent external content root                               |
| `FUYAO_FAVICON_ROOT`          | Production build, deployment                     | Persistent external favicon directory                          |
| `FUYAO_SHARED_ROOT`           | Deployment                                       | Persistent root containing configuration, content, and secrets |
| `FUYAO_RELEASE_ROOT`          | Deployment                                       | Directory containing independent releases                      |
| `FUYAO_CURRENT_LINK`          | Deployment                                       | Symbolic link to the active release                            |
| `FUYAO_DEPLOY_LOCK`           | Optional                                         | Build and deployment mutex path                                |
| `FUYAO_SECRETS_FILE`          | Optional                                         | Secret values that final artifact scanning must reject         |
| `FUYAO_REPOSITORY_URL`        | Deployment without a local source root           | Public source repository URL                                   |
| `FUYAO_SOURCE_ROOT`           | Optional                                         | Existing source directory, avoiding a fresh clone              |
| `FUYAO_RELEASE_KEEP`          | Optional                                         | Number of successful releases to retain; default `5`           |
| `FUYAO_HEALTHCHECK_URL`       | Optional                                         | Site URL used to validate `release.json` after switching       |
| `FUYAO_POSTS_WATCH_DIR`       | Content watcher                                  | Article directory to watch                                     |
| `FUYAO_ALBUM_PHOTOS_DIR`      | Album generation, content watcher                | Album-originals directory                                      |
| `FUYAO_ALBUM_THUMBNAILS_DIR`  | Album generation, content preparation            | Album-thumbnail directory                                      |
| `FUYAO_ALBUM_METADATA_DIR`    | Album generation, content preparation            | Album-index output directory                                   |
| `FUYAO_ALBUM_COORD_TYPE`      | Optional                                         | Source EXIF coordinate system: `wgs84` or `gcj02`              |
| `FUYAO_CONTENT_PENDING_FILE`  | Content preparation                              | Pending-deployment state file                                  |
| `FUYAO_WATCH_MODE`            | Optional                                         | Content-watcher mode: `prepare` or `deploy`                    |
| `FUYAO_WATCH_DEBOUNCE_MS`     | Optional                                         | File-event debounce in milliseconds; default `5000`            |
| `FUYAO_CONTENT_DEPLOY_SCRIPT` | Optional                                         | Preparation or deployment script invoked by the watcher        |
| `FUYAO_LEGACY_ROOT`           | 3.0.0 migration                                  | Independent copy of the 3.0.0 source tree                      |
| `FUYAO_MIGRATION_TYPES`       | Optional                                         | Comma-separated content types to migrate                       |
| `FUYAO_MIGRATION_MANIFEST`    | Migration apply                                  | SHA-256 migration-manifest output path                         |
| `FUYAO_PRIVACY_TERMS_FILE`    | Optional                                         | External privacy-term file, one term per line                  |

`FUYAO_SKIP_LOCK`, `FUYAO_SKIP_INSTALL`, `FUYAO_FAST_DEPLOY`, `FUYAO_DEPLOY_REASON`, and snapshot-related variables are passed internally by deployment and content scripts. They are not routine operator configuration.

The former `.env` configuration has been migrated and is no longer tracked. The project does not use `.env.build`, `.env.dev`, or `.env.local`. Git continues to ignore every environment file except `.env.example`; do not stage them for release. Previously reviewed high-entropy demonstration values are suppressed only by SHA-256 fingerprints. Any new high-entropy value still fails the audit.

GitHub tokens, deployment tokens, private keys, passwords, and webhook secrets belong only in server-side secret management. Cloudflare API tokens and Zone IDs remain in a separate proxy service; this repository does not maintain Worker deployment configuration. WakaTime or analytics URLs containing non-public credentials must be placed behind a server-side proxy.

## 6. Build Modes

### 6.1 Development and CI

```bash
npm ci
npm run check
npm test
npm run build
```

These commands use `config/*.example.yaml` and `fixtures/content/`, copy the inputs to `.fuyao/build-inputs/current/`, generate indexes, and freeze the result as a read-only snapshot. Generated files are never written back to `static`.

### 6.2 Production

```bash
export FUYAO_CONFIG_ROOT=/srv/fuyao/shared/config
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_FAVICON_ROOT=/srv/fuyao/shared/legacy/root-assets/favicon
export FUYAO_DEPLOY_LOCK="$PWD/.fuyao/production-build.lock"
npm run build:production
```

For a local build, point `FUYAO_DEPLOY_LOCK` to a temporary file inside the current workspace. The server deployment service continues to use `/srv/fuyao/deploy.lock`. Production mode rejects missing directories, sample configuration, and incompatible schemas. Public album metadata retains EXIF GPS coordinates, which become browser-readable JSON. The final build scans again for secrets and server-only absolute paths.

## 7. Atomic Deployment and Rollback

Production templates live in `deploy/systemd/` and `deploy/caddy/`. `npm run deploy` performs the following transaction:

1. Acquire the deployment lock.
2. Clone public `main` into a temporary directory.
3. Read external configuration and content without modifying them, then prepare a build snapshot.
4. Run checks, tests, the production build, and artifact scanning.
5. Copy the build into a new `releases/<release-id>/` directory.
6. Atomically switch `current`, then run the optional health check.
7. Restore the old target if the health check fails; otherwise remove excess old releases according to the retention setting.

Rollback command:

```bash
node scripts/deploy.js --rollback=<release-id>
```

Rollback switches only the release pointer. It does not modify persistent content.

## 8. Content Watching

Production uses `fuyao-content-watcher.service` to watch the authoritative content directories:

- Markdown changes under `/srv/fuyao/shared/content/posts/` add `posts` to the pending-deployment state.
- Image changes under `/srv/fuyao/shared/content/albums/photos/` import new root-level photos, rename and archive them by date, generate responsive WebP thumbnails and public EXIF metadata with GPS, and add `albums` to pending state.
- A five-second debounce coalesces rapid events. Events received during processing remain queued rather than starting a concurrent operation.

Upload `jpg`, `jpeg`, `png`, `heic`, `webp`, `tiff`, or `tif` files directly to the root of `albums/photos/`. Do not write manually to `thumbnails/` or `metadata/`.

The service runs verified source and dependencies from `/srv/fuyao/tooling/current` through `/opt/fuyao/node/bin/node`. Update tooling after releasing new code. Content changes no longer clone the remote repository on demand.

The server prepares content and writes `/srv/fuyao/shared/content/state/pending-deploy.json`; it does not run the Vite production build. The release workflow downloads external configuration, content, and favicons to the build host, runs `npm run build:production`, uploads an independent release with rsync, and atomically switches `current`. This prevents prerendering from causing out-of-memory failures or heavy swapping on low-memory servers.

```bash
systemctl reload fuyao-content-watcher.service
systemctl kill -s SIGUSR2 fuyao-content-watcher.service
journalctl -u fuyao-content-watcher.service -f
```

- `reload`: manually record a pending article update.
- `SIGUSR2`: manually prepare albums and record a pending update.
- `journalctl`: follow watcher and content-preparation output.

The former `/root/blog-tools/scripts/watch-posts.js` watched only `/home/caddy/www/index/posts`. Disable `blog-watcher.service` after migration. You may retain the old tooling and unit backup for rollback, but never run both watchers at the same time.

## 9. Migrating 3.0.0 Content

See [Migrating from 3.0.0 to 27.0](./MIGRATION_3_TO_27.md) for the full field mapping, exclusions, validation, secret boundaries, and rollback procedure. The migration script reads an independent 3.0.0 tree through `FUYAO_LEGACY_ROOT`; it does not rely on `static/posts` or `static/data`, which no longer exist in the 27.0 repository.

Create a read-only migration plan first:

```bash
export FUYAO_LEGACY_ROOT=/srv/fuyao/migration-source/3.0.0
export FUYAO_MIGRATION_TYPES=posts,footprints
npm run content:migrate:plan
```

After confirming the external content root and manifest location, apply the migration:

```bash
export FUYAO_CONTENT_ROOT=/srv/fuyao/shared/content
export FUYAO_MIGRATION_MANIFEST=/srv/fuyao/shared/backups/migration-<date>.json
npm run content:migrate:apply
```

The script does not overwrite a target file with different content or delete a source file. It records file count, total bytes, and SHA-256 for every file. Repository samples already live under `config/` and `fixtures/content/`. Before removing any future real YAML, article, media, or generated index from Git, create an external backup and verify a sample restoration.

If a secret ever entered Git history, rotate or revoke it at the provider before using a dedicated history-rewriting tool to remove every reference. Deleting only the latest copy is insufficient. Run the audits again after rewriting:

```bash
npm run audit:privacy
npm run audit:history
```

List personal names, domains, email addresses, usernames, and coordinates in an external `FUYAO_PRIVACY_TERMS_FILE`, one term per line. The scanner reports matching file paths without printing the sensitive terms.

## 10. Version and Build Train

`version.json` is the only manually maintained source. Versions use valid SemVer. The page omits a zero patch component and otherwise shows the full version. Version `27.1.1`, Build Train `4B`, and build sequence `116` appear as `27.1.1 (4B116)`. The build identifier concatenates the train and decimal sequence without leading zeroes.

```bash
npm run version:show
npm run version:set -- 27.2.0 4C
npm run build:set -- 117
npm run build:bump
npm run train:set -- 4C
```

Development, checks, tests, and builds never change the version automatically. Only explicit version commands synchronize `version.json`, `package.json`, and `package-lock.json`.
