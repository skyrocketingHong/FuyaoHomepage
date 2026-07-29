English | [简体中文](./CHANGELOG_ZH.md)

# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 27.1.1 (2026-07-29)

### Added

- Added reusable three-part Pass components that standardize card surfaces, identity bars, content areas, and action-area semantics.
- Added a “Support This Site” information Pass with usage details, privacy notes for locally generated payment QR codes, and bilingual copy.

### Changed

- Reworked the support page into a full-viewport vertical Wallet stack, keyed expansion state by stable payment IDs, and adjusted card spacing, compact layout, and high-resolution QR sizing to available space.
- Unified text, icon, and separator colors across the desktop sidebar and mobile information dock; links now increase contrast only on hover or keyboard focus.
- Improved expanded-state, controlled-region, and disabled-content semantics for payment cards, reducing interference from unselected cards for keyboards and assistive technology.

### Fixed

- Fixed reversed default payment-card order and stacking, duplicate mobile horizontal spacing, and card surfaces failing to extend behind the fixed bottom dock.
- Fixed unstable QR-code and action-area allocation across different viewport heights.

## 27.1 (2026-07-28)

### Added

- Added a six-item equal-width mobile Tab Bar and fixed bottom dock.
- Added Bing-branded daily-wallpaper attribution, injected into the desktop sidebar and mobile information dock only after the endpoint image displays successfully.
- Added a daily coding-language detail contract, real language-stacked bars, and a neutral fallback when details are unavailable.

### Changed

- Replaced the image background with Bing daily wallpaper, selecting the portrait-mobile or default size by viewport and adding fallback wallpaper and theme-solid recovery layers.
- Unified blue-gray tint, translucency, and background-legibility masks across transparent Liquid Glass surfaces.
- Refactored the mobile header, navigation, and information dock with consistent live blur, responsive spacing, safe-area handling, and compact single-line layouts.
- Refactored the support page into a mobile Wallet stack, centered tablet column, and wide-screen master-detail layout with consistent content-card radii.
- Unified layouts for error, empty-data, no-filter-results, and payment-configuration status cards, centering them within the available area between the header and fixed dock.
- Moved production favicons into external persistent assets, standardized readable permissions for public build inputs and releases, and expanded deployment health checks.

### Fixed

- Fixed mobile locale-button compression, oversaturated navigation material, and footprint controls overlapping the fixed dock.
- Fixed duplicate horizontal padding in payment cards and the mobile Tab Bar, plus fixed-area height jumps caused by wrapped footer text.
- Fixed hard-coded coding-activity bar colors that could not represent real language composition.

## 27.0.0 (2026-07-27)

### Added

- Added albums with responsive photo grids, deep links, a full-screen lightbox, EXIF information, and date/device filtering.
- Added album-index and responsive WebP-thumbnail generation, including public indexes that omit precise location fields.
- Added versioned YAML schemas for site configuration and content paths, plus public demonstration configuration and fixtures.
- Added read-only build-input snapshots, strict production validation, final-artifact exposure scans, and Git privacy audits.
- Added external-content migration, independent release deployment, atomic switching, health checks, and failure rollback.
- Added systemd and Caddy deployment templates and GitHub Actions continuous integration.
- Added a complete prerender list for blog categories, articles, and tag pages.
- Added AMap JS API 2.0 `MarkerCluster` aggregation to the footprint map.
- Added a guide for migrating 3.0.0 configuration, articles, and footprint data to 27.0.

### Changed

- Migrated public 3.0.0 `.env` fields to YAML and `static/` content to external sources and public fixtures, removing the runtime dual-source model.
- Reduced browser-visible configuration to a build-time allowlist, isolating server paths, production secrets, and personal content.
- Unified blog indexes, search indexes, RSS, Sitemap, and album metadata generation around frozen content snapshots.
- Standardized development and CI on public demonstration inputs; production builds now fail when valid external configuration or content is missing.
- Refactored blog routing and server data loading for consistent categories, tags, search, article pages, RSS, Sitemap, and SEO.
- Refactored Markdown rendering with stronger raw-HTML sanitization, media loading, external-link handling, code copying, table semantics, and horizontal scrolling.
- Refactored Liquid Glass around a shared WebGL2 compositor, size-aware refraction, tiered blur fallback, and consistent glass boundaries.
- Optimized background switching and mosaic-canvas loading transactions to reduce repeated drawing and flashes during resize.
- Improved layout, visual hierarchy, and light/dark presentation across the blog home, article reader, footprint map, and photo lightbox.
- Completed localized album dates, EXIF fields, and empty states.
- Centralized marketing version, Build Train, and build sequence in `version.json`; version changes now require explicit release operations.

### Fixed

- Fixed homepage social-link card names losing right alignment after wrapping.
- Fixed a race where leaving an empty album cleared a new page's Header slot with an empty ID; cleanup now uses strict registration ownership.
- Fixed article pages retaining the mosaic background after article type was misidentified under the unified blog catch-all route.
- Fixed article first render depending on client requests, missing server content on category pages, invalid search-server request URLs, and incorrect states for illegal paths.
- Removed duplicate dynamic and static implementations of RSS and Sitemap.
- Fixed album deep-link validation, lightbox history, stale page titles, callback cleanup, and information-panel scrolling.
- Fixed missing album data being hidden by an empty state, inconsistent date timezone handling, and grids loading original images directly.
- Fixed incorrect Markdown link previews, duplicated KaTeX formulas, and GFM table alignment, width, and scrolling behavior.
- Fixed black frames during mosaic-canvas rebuild, stale renders ending loading early, and exceptions leaving loading permanently blocked.
- Fixed live blur, content safe spacing, and final-content obstruction around the mobile top and bottom glass layers.
- Fixed ordinary page endings fading under masks and footprint maps showing edge masks and white borders.
- Fixed button-content offsets, invalid HTML nesting, and abrupt state-copy changes during locale switching.

## 3.0.0 (2026-02-10)

Rebuilt and launched the footprint map, modularized the CSS architecture, and expanded footprint interactions and tooling.

### Added

- Font demonstration article at `static/posts/example-category/font-test.md`.
- Modular style architecture under `src/lib/styles/`, including `fonts.css`, `theme.css`, and `base.css`.
- Footprint components and utilities including `FootprintActions.svelte`, `GeneratorModal.svelte`, and `footprintYaml.ts`.
- Svelte 5 state store in `mosaic.svelte.ts`.

### Changed

- **Style architecture**: split the large stylesheet into cohesive modules.
- **Comments**: standardized source comments.
- **Map behavior**: improved AMap type safety and interaction logic.
- **Project layout**: consolidated utility directories.

### Fixed

- **Type safety**: corrected AMap interfaces and types.
- **Network loading**: added timestamps to avoid stale file caches.
- **UI details**: synchronized sidebar and map-attribution styling.

## 2.2.0 (2026-02-04)

Added site-wide internationalization, introduced branch-based data separation, refactored friend links and blog indexes, and continued visual and SEO improvements.

### Added

- **Internationalization**: extracted site text, added i18n, and introduced locale switching.
- **Branch strategy**: kept only test and preview data on `main` while maintaining personal data separately.
- **Friend links**: redesigned the data model with reachable and unavailable states.
- **Blog indexes**: introduced a new article-index generation system.
- **Category aliases**: added category slugs for semantic URLs.

### Changed

- **Visual experience**:
  - Improved Header button hover behavior and top-navigation motion.
  - Adjusted GitHub project-card padding and removed excess whitespace.
  - Improved the English layout of `TimeCapsule`.
  - Standardized blockquote font sizes and prevented nested scaling.
  - Improved Header navigation centering and `MainContent` top spacing.
- **Reader typography**: standardized vertical rhythm for article text, headings, and code blocks in `reader.css`.
- **SEO**: improved Sitemap generation, integrated blog article data, and handled legacy-site 301 redirects.

### Fixed

- **Interaction**: fixed a z-index issue that made the footprint map unresponsive.
- **Routing**:
  - Fixed matching for nested category paths.
  - Fixed asynchronous message-channel closure errors during blog navigation.
- **Stability**:
  - Fixed wallpaper API requests causing DNS failures during SSR.
  - Corrected mismatches between Markdown filenames and slugs.
  - Fixed compiler warnings caused by captured component state.

## 2.1.0 (2026-02-02)

Improved blog architecture, added RSS, and refined sidebar behavior and SEO.

### Added

- **RSS**: generated a site-wide RSS XML feed at `/blog/rss.xml/`.
- **View switching**: added `SegmentedControl` for year and tag archives.
- **Route matching**: supported nested category paths, tag filtering, and trailing-slash normalization.
- **Color system**: introduced more authentic MTR mosaic station colors.

### Changed

- **Architecture**: split blog components into `BlogHome`, `BlogViewer`, `Sidebar`, and related modules.
- **Data**: adopted a unified `all.json` source.
- **SEO**: completed JSON-LD structured data and improved category and tag descriptions.
- **State**: strengthened reactive coordination between `SidebarState` and `HeaderState`.

### Fixed

- Fixed nested blog-category route matching.
- Fixed sidebar state loss during rapid route changes.
- Fixed `LiquidGlass` redraw behavior in specific modes.

## 2.0.0 (2026-01-31)

Rebuilt the application architecture, introduced automated content management, and improved performance and SEO.

### Added

- **Automated blog**: added a Markdown workflow with `vite-plugin-blog-watcher` and `generate-blog-index.js`.
- **Modular architecture**: split `src/lib` by responsibility.
- **Sitemap**: generated `sitemap.xml` dynamically.
- **UI features**: added an opaque `LiquidGlass` mode and MTR icons to `MosaicInfo`.

### Changed

- **Rendering performance**:
  - Rebuilt the mosaic core with HTML5 Canvas.
  - Added deferred `lazyBlur` rendering to `LiquidGlass`.
- **Interaction**:
  - Improved `MainContent` spacing transitions.
  - Improved mobile header and footer mask behavior.
- **Code quality**: standardized Simplified Chinese comments and JSDoc.
- **Resources**: optimized font loading and synchronized footprint, friend, and payment files.

### Fixed

- Fixed background rendering in the `Copyright` component.
- Fixed mobile navigation adaptation.
- Fixed layout jitter caused by buttons wrapping on narrow screens.

## 1.1.0 (2026-01-25)

Refactored core components, improved mobile navigation, and expanded documentation.

### Added

- **UI components**: added `HeaderActionButton`, multi-effect `TextEffect`, and auto-scrolling `AutoScroll`.
- **Fonts**: integrated MiSans definitions.
- **Tooling**: added script and version-management directories.

### Changed

- **Visual performance**: refactored `LiquidGlass` and forced hardware acceleration.
- **Layout**: improved the `MobileNav` route-distribution algorithm.
- **Reuse**: extracted shared `HeaderActions` logic.
- **Documentation**: expanded Chinese comments and project-structure documentation.

### Fixed

- Fixed `Copyright` styling details.
- Fixed module import paths and type definitions.
- Fixed initial anchor positioning while loading desktop articles.

## 1.0.0 (2026-01-25)

Initialized the project with its core architecture and multilingual support.
