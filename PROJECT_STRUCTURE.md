English | [简体中文](./PROJECT_STRUCTURE_ZH.md)

# Project Structure and Overview

## Overview

This project is a personal homepage and blog system built with SvelteKit.
Its main features include a personal profile, GitHub project showcase, footprint map, friend links, blog articles, and albums.
The application uses Svelte 5 Runes, Tailwind CSS, and TypeScript.

The public repository contains only source code, `config/*.example.yaml` migrated from the former `.env`, and public demonstration data under `fixtures/content/` migrated from the former `static/` content. Production configuration, content, and secrets remain outside the repository. Builds use the read-only `.fuyao/build-inputs/current/` snapshot and produce independent releases.

## Directory Structure

```text
.
├── .env.example          # Environment-variable sample
├── .gitignore            # Git ignore rules
├── .github/workflows/    # GitHub Actions continuous integration
│   └── ci.yml            # Type, format, test, and build checks
├── .npmrc                # npm configuration
├── .prettierignore       # Prettier ignore rules
├── .prettierrc           # Prettier configuration
├── CHANGELOG.md          # English changelog
├── CHANGELOG_ZH.md       # Simplified Chinese changelog
├── config/               # Versioned public configuration samples only
│   ├── site.example.yaml
│   └── content.example.yaml
├── deploy/               # Production service and web-server templates
│   ├── caddy/FuyaoHomepage.caddy.example
│   └── systemd/
│       ├── fuyao-deploy.service
│       ├── fuyao-public-data.service # Loopback data cache with private configuration credentials
│       └── fuyao-content-watcher.service # Low-memory article, album, data, and favicon publisher
├── fixtures/content/     # Public demonstration content for development and CI
│   ├── posts/            # Markdown demonstration articles migrated from static
│   ├── data/             # Footprint, friend, payment, and social samples
│   └── albums/           # Empty media directories and versioned metadata
├── CONFIGURATION.md      # English configuration and deployment guide
├── CONFIGURATION_ZH.md   # Simplified Chinese configuration and deployment guide
├── LICENSE               # Project license
├── MIGRATION_3_TO_27.md     # English 3.0.0 to 27.0 migration guide
├── MIGRATION_3_TO_27_ZH.md  # Simplified Chinese migration guide
├── PROJECT_STRUCTURE.md     # English project structure (this document)
├── PROJECT_STRUCTURE_ZH.md  # Simplified Chinese project structure
├── README.md             # Default English project README
├── README_ZH.md          # Simplified Chinese project README
├── eslint.config.js      # ESLint configuration
├── package-lock.json     # npm dependency lockfile
├── package.json          # npm package configuration
├── svelte.config.js      # SvelteKit configuration
├── tsconfig.json         # TypeScript configuration
├── version.json          # Single source for marketing version, Build Train, and build sequence
├── vite.config.ts        # Vite configuration
├── scripts/              # Tooling and version management
│   ├── lib/
│   │   └── public-permissions.js # Normalize and verify public build and release permissions
│   ├── serve-public-data.py # Fixed public JSON endpoints and persistent successful-response caching
│   ├── generate-blog-index.js # Generate blog indexes, RSS, and Sitemap
│   ├── generate-album-index.js# Generate EXIF indexes and responsive thumbnails
│   ├── prepare-build-inputs.js # Validate, copy, and freeze external favicon/content inputs
│   ├── prepare-content-update.js # Low-memory album preparation and pending state
│   ├── prepare-content-release.js # Assemble and validate mutable public content without Vite
│   ├── prepare-spa-fallback.js # Reuse prerendered GlobalLoader markup in the SPA fallback
│   ├── validate-deployment.js  # Input, artifact exposure, and public-read checks
│   ├── audit-repository.js     # Privacy scan for current files and complete Git history
│   ├── migrate-content.js      # External persistent-content copy with SHA-256 manifest
│   ├── deploy.js               # Independent releases, atomic switching, and rollback
│   ├── deploy-content.js       # Hard-linked low-memory content releases and atomic switching
│   ├── watch-content.js       # Recursive content watcher with durable event coalescing
│   └── update-version.js      # Version validation, synchronization, and Build Train formatting
├── src/
│   ├── app.d.ts          # TypeScript declarations
│   ├── app.html          # HTML template
│   ├── hooks.client.ts   # Hydrate the real GlobalLoader before SPA route resolution
│   ├── service-worker.ts # Service Worker
│   ├── lib/              # Core application library
│   │   ├── actions/          # Svelte Actions
│   │   │   ├── linkEnhancer.svelte.ts        # Preview enhancement for standalone bare URLs
│   │   │   └── tableScrollEnhancer.svelte.ts # Wheel and keyboard scrolling for Markdown tables
│   │   ├── config/           # Site configuration
│   │   │   ├── index.ts      # Page-configuration entry point
│   │   │   ├── schema.ts     # Site/content schemas, types, and allowlist validation
│   │   │   ├── public.ts     # Single browser-visible configuration entry point
│   │   │   ├── server.ts     # YAML, realpath, and build-side configuration loader
│   │   │   └── mosaic.ts     # MTR color presets, line sections, and adjacency queries
│   │   ├── plugins/          # Vite plugins
│   │   │   └── vite-plugin-blog-watcher.ts # Development blog-file watcher
│   │   ├── hooks/            # Svelte composable hooks
│   │   │   └── useBlogState.svelte.ts # Blog state-management hook
│   │   ├── stores/           # Global state management
│   │   │   ├── app.svelte.ts     # App state with reentrant background transactions and strict Header slots
│   │   │   ├── backgroundInfo.svelte.ts # Full-screen background-information visibility and source
│   │   │   ├── lightbox.svelte.ts# Lightbox state using Svelte 5 Runes
│   │   │   ├── mosaic.svelte.ts  # Current and user-selected MTR station state
│   │   │   └── search.svelte.ts  # Search state
│   │   ├── styles/           # Global styles
│   │   │   ├── app.css       # Global style entry point
│   │   │   ├── base.css      # Base element styles
│   │   │   ├── components.css# Shared component styles
│   │   │   ├── fonts.css     # Font definitions
│   │   │   ├── reader-syntax.css # Reader syntax highlighting
│   │   │   ├── reader.css    # Reader typography
│   │   │   ├── theme.css     # Theme and material tokens
│   │   │   └── utilities.css # Global utility classes
│   │   ├── types/            # Type definitions
│   │   │   ├── album.ts      # Album types: Photo, AlbumIndex, and YearGroup
│   │   │   ├── component.ts  # Runtime dynamic-component types
│   │   │   ├── sidebar.ts    # Sidebar types
│   │   │   └── modules.d.ts  # Third-party module declarations
│   │   ├── components/       # Svelte component library
│   │   │   ├── albums/       # Album page components
│   │   │   │   ├── AlbumGrid.svelte       # Justified photo grid
│   │   │   │   ├── AlbumSidebar.svelte    # Date/device album sidebar
│   │   │   │   ├── BrandIcon.svelte       # Camera and lens brand icons
│   │   │   │   ├── LightboxNavButton.svelte # Reusable lightbox navigation button
│   │   │   │   ├── PhotoLightbox.svelte   # Full-screen photo lightbox with EXIF
│   │   │   │   └── YearNav.svelte         # Year navigation using SegmentedControl
│   │   │   ├── footprint/    # Footprint page components
│   │   │   │   ├── FootprintActions.svelte   # Footprint action buttons
│   │   │   │   ├── FootprintList.svelte      # Footprint list
│   │   │   │   ├── GeneratorModal.svelte     # YAML generator dialog
│   │   │   │   ├── PlaceSearchDropdown.svelte# Place-search results
│   │   │   │   └── map/                      # Map components
│   │   │   │       ├── AMap.svelte           # Native markers, controls, and load state
│   │   │   │       ├── MapCopyright.svelte   # Map attribution
│   │   │   │       ├── MapInfoWindow.svelte  # Content inside the native information window
│   │   │   │       ├── types.ts              # Map types
│   │   │   │       └── core/                 # Map core logic
│   │   │   │           ├── copyright.ts          # Attribution utilities
│   │   │   │           ├── infoWindowController.svelte.ts # Information-window controller
│   │   │   │           ├── loader.ts             # Shared SDK loading, timeout, and retry
│   │   │   │           ├── markers.ts            # Marker management
│   │   │   │           ├── placeSearch.ts        # Place search
│   │   │   │           ├── view.ts               # View utilities
│   │   │   │           └── viewController.svelte.ts # Native nonlinear camera and reduced motion
│   │   │   ├── friends/      # Friend page components
│   │   │   │   ├── FriendCard.svelte        # Friend-link card
│   │   │   │   └── ProfileCard.svelte       # Profile card
│   │   │   ├── home/         # Homepage components
│   │   │   │   ├── Hero.svelte              # Homepage hero
│   │   │   │   └── content/                 # Homepage content components
│   │   │   │       ├── CloudflareAnalytics.svelte # Traffic analytics
│   │   │   │       ├── CodingActivity.svelte # Real daily language stacks with neutral fallback
│   │   │   │       ├── GithubProjects.svelte # GitHub project showcase
│   │   │   │       ├── LatestPosts.svelte    # Latest articles
│   │   │   │       ├── ProfileSection.svelte # Profile details
│   │   │   │       ├── SocialLinks.svelte    # Social-link list
│   │   │   │       ├── TimeCapsule.svelte    # Time capsule and personal status
│   │   │   │       └── common/               # Shared homepage cards and headings
│   │   │   │           ├── ContentCard.svelte
│   │   │   │           └── SectionHeader.svelte
│   │   │   ├── blog/         # Newsroom-styled blog components
│   │   │   │   ├── card/         # Article cards
│   │   │   │   │   ├── FeaturedPostCard.svelte # Full-width featured Newsroom card
│   │   │   │   │   ├── GridPostCard.svelte  # Secondary and standard Newsroom grid cards
│   │   │   │   │   ├── ListPostCard.svelte  # Compact Newsroom article row
│   │   │   │   │   └── PostCard.svelte      # Four-variant article-card entry point
│   │   │   │   ├── common/       # Shared small components
│   │   │   │   │   ├── CategoryBadge.svelte # Category badge
│   │   │   │   │   └── TagBadge.svelte      # Neutral Newsroom tag control
│   │   │   │   ├── home/         # Blog home view
│   │   │   │   │   ├── EmptyState.svelte    # Newsroom empty article state
│   │   │   │   │   └── Home.svelte          # Newsroom 1+2+3 article grid
│   │   │   │   ├── search/       # Search view
│   │   │   │   │   └── Search.svelte        # Newsroom search field and separated results
│   │   │   │   ├── sidebar/      # Blog sidebar
│   │   │   │   │   ├── Sidebar.svelte       # Archives and categories
│   │   │   │   │   └── TagCloud.svelte      # Tag cloud
│   │   │   │   ├── viewer/       # Article reader
│   │   │   │   │   ├── BackButton.svelte    # Return-to-list button
│   │   │   │   │   ├── Header.svelte        # Newsroom title, metadata, sharing, and cover
│   │   │   │   │   ├── LinkPreview.svelte   # Flat Newsroom link preview
│   │   │   │   │   ├── MarkdownRenderer.svelte # Markdown renderer
│   │   │   │   │   ├── TableOfContents.svelte # Depth-indented article table of contents
│   │   │   │   │   └── Viewer.svelte        # Newsroom reader entry point
│   │   │   │   └── header/       # Header integration
│   │   │   │       ├── Actions.svelte        # Search and RSS action group
│   │   │   │       ├── RssButton.svelte      # RSS button
│   │   │   │       └── SearchButton.svelte   # Search button
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── background/   # Background components
│   │   │   │   │   ├── BackgroundInfoOverlay.svelte # Routed full-screen MTR browser, mobile drawer, and Bing original view
│   │   │   │   │   └── BackgroundLayer.svelte # Route-aware wallpaper, Newsroom, and reader backgrounds
│   │   │   │   ├── bottom-info/  # Footer information components
│   │   │   │   │   ├── BottomInfo.svelte       # Unified desktop/mobile information container
│   │   │   │   │   ├── BackgroundInfo.svelte   # Single-line background location with full semantics
│   │   │   │   │   ├── CopyrightText.svelte    # Copyright, repository, and version information
│   │   │   │   │   └── ServiceStatus.svelte    # Service and deployment-platform status
│   │   │   │   ├── content/      # Content-area components
│   │   │   │   │   └── MainContent.svelte    # Horizontal spacing, scrolling, and viewport centering
│   │   │   │   ├── header/       # Header components
│   │   │   │   │   ├── Header.svelte         # Shared site Header with mobile title hierarchy
│   │   │   │   │   ├── HeaderChrome.svelte   # Live-blurred top chrome with responsive heights
│   │   │   │   │   ├── Actions.svelte        # Background, theme, and locale actions
│   │   │   │   │   ├── BackgroundSwitcher.svelte # Segmented desktop and cycling mobile switcher
│   │   │   │   │   ├── ActionButton.svelte   # Standalone-glass and bare segmented actions
│   │   │   │   │   ├── ActionGroup.svelte    # Static-material segmented control group
│   │   │   │   │   └── drawer/               # Mobile menu
│   │   │   │   │       └── Drawer.svelte         # Mobile sidebar drawer
│   │   │   │   ├── nav/          # Navigation
│   │   │   │   │   ├── CategoryNav.svelte    # Top category navigation
│   │   │   │   │   ├── MobileBottomDock.svelte # Two live-blurred pills, gap, and safe area
│   │   │   │   │   └── MobileNav.svelte      # Six direct tabs plus an optional injected-list drawer tab
│   │   │   │   ├── loader/       # Loading indicators
│   │   │   │   │   ├── GlobalLoader.svelte   # Initial background and canvas-rebuild overlay
│   │   │   │   │   └── spaFallbackLoader.ts  # Hydrate and outro the same loader in SPA fallback
│   │   │   │   └── sidebar/      # Global sidebar
│   │   │   │       ├── Sidebar.svelte        # Desktop sidebar container
│   │   │   │       ├── SidebarTree.svelte    # Recursive navigation tree
│   │   │   │       └── Item.svelte           # Navigation item
│   │   │   ├── pay/          # Payment and support components
│   │   │   │   ├── pass/                       # Reusable three-part Pass atoms
│   │   │   │   │   ├── PassCard.svelte        # Surface, clipping, shadow, and layout shell
│   │   │   │   │   ├── PassIdentityBar.svelte # Icon, title, description, and expansion control
│   │   │   │   │   ├── PassContentArea.svelte # Flexible start/center/fill content area
│   │   │   │   │   └── PassActionArea.svelte  # Fixed-height text/link/status action area
│   │   │   │   ├── PaymentIntro.svelte       # White support-purpose and privacy Pass
│   │   │   │   ├── QRCodeCard.svelte         # Stable expansion, stacking, track, and sizing controller
│   │   │   │   └── WalletPass.svelte         # Branded payment Pass with local high-resolution QR
│   │   │   ├── seo/          # SEO components
│   │   │   │   └── SeoHead.svelte            # HTML metadata management
│   │   │   └── ui/           # Shared UI atoms
│   │   │       ├── background/   # Background effects and attribution
│   │   │       │   ├── BingWallpaperInfo.svelte # Bing attribution and full-screen original-view entry
│   │   │       │   ├── FlowingBackground.svelte # Flowing gradient
│   │   │       │   ├── MosaicBackground.svelte  # Mosaic drawing, fixed-station selection, and failure fallback
│   │   │       │   ├── MosaicInfo.svelte        # Crossfading station attribution and background-browser entry
│   │   │       │   └── SolidBackground.svelte   # Solid and base background
│   │   │       ├── display/      # Display components
│   │   │       │   ├── Avatar.svelte         # Avatar
│   │   │       │   ├── LazyImage.svelte      # Picture sources and configurable loading priority
│   │   │       │   ├── Marquee.svelte        # Overflow-only marquee with optional edge fade
│   │   │       │   └── SegmentedControl.svelte # Segmented control
│   │   │       ├── effect/       # Visual effects
│   │   │       │   ├── Crossfade.svelte      # Crossfade transition
│   │   │       │   ├── FadeEdge.svelte       # CSS Mask edge fade with independent sides
│   │   │       │   ├── GlassCompositor.svelte # Shared WebGL2 glass-compositor canvas
│   │   │       │   ├── LiquidGlass.svelte    # Tiered glass materials, edges, live blur, and layout
│   │   │       │   └── TextEffect.svelte     # Text typing and effects
│   │   │       ├── feedback/     # Feedback and status
│   │   │       │   ├── LoadingSpinner.svelte # Loading spinner
│   │   │       │   ├── LoadingState.svelte   # Full-screen and embedded loading state
│   │   │       │   ├── Skeleton.svelte       # Skeleton placeholder
│   │   │       │   └── StatusState.svelte    # Error and empty states with locale transitions
│   │   │       └── layout/       # Layout helpers
│   │   │           └── ScrollContainer.svelte# Shared scroll container
│   │   ├── i18n/             # Internationalization
│   │   │   ├── index.ts      # i18n entry point
│   │   │   ├── store.ts      # Locale-switching state
│   │   │   └── locales/      # Translation resources
│   │   │       ├── en-US.json
│   │   │       └── zh-CN.json
│   │   └── utils/            # Utility functions
│   │       ├── datetime/     # Date and time
│   │       │   ├── age.ts            # Age calculation
│   │       │   └── date.ts           # Date formatting
│   │       ├── domain/       # Domain logic
│   │       │   ├── blog.ts           # Blog data processing
│   │       │   ├── blogRoute.ts      # Catch-all category, tag, and article path parsing
│   │       │   ├── github.ts         # Public repository validation and deduplication
│   │       │   ├── statistics.ts     # Date, language, and aggregate-statistic normalization
│   │       │   ├── exif.ts           # Shared album-grid/lightbox EXIF formatting
│   │       │   ├── footprintYaml.ts  # Footprint YAML generation
│   │       │   ├── footprints.ts     # Footprint data processing
│   │       │   ├── loader.ts         # Data loaders
│   │       │   ├── map.ts            # Map links and GCJ-02/WGS-84 conversion
│   │       │   ├── markdown.ts       # Markdown AST parsing, sanitization, and enhancement
│   │       │   ├── nav.ts            # Navigation utilities
│   │       │   └── wallpaper.ts      # Bing metadata validation, normalization, and locale URLs
│   │       ├── effect/       # Visual-effect utilities
│   │       │   ├── appearanceTransition.svelte.ts # View Transition detection and Crossfade fallback
│   │       │   ├── glassCompositor.svelte.ts # Shared on-demand two-level WebGL2 Gaussian blur
│   │       │   └── liquidGlass.ts # Size-aware single-channel SVG refraction filters
│   │       ├── format/       # Content formatting
│   │       │   ├── number.ts         # Number formatting
│   │       │   └── slugify.ts        # Slug normalization
│   │       ├── network/      # Network and loading
│   │       │   ├── jsonResource.ts # Bounded requests and validated recent-success caching
│   │       │   ├── loading.ts        # Request-loading state
│   │       │   └── urlMetadata.ts    # URL metadata retrieval
│   │       ├── state/        # State-ownership utilities
│   │       │   └── headerOwnership.ts # Non-empty Header registration-ID ownership
│   │       └── index.ts      # Utility exports
│   └── routes/               # SvelteKit routes
│       ├── +layout.svelte    # Global Header and Sidebar layout
│       ├── +layout.ts        # Client-compatible shared loading logic
│       ├── +page.svelte      # Homepage entry point
│       ├── background/       # Direct background-information routes
│       │   ├── mtr/+page.svelte # MTR background-information entry
│       │   └── wallpaper/+page.svelte # Bing wallpaper-information entry
│       ├── albums/[...path]/ # Album lists, filters, and photo deep links
│       │   ├── +page.svelte  # Grid, sidebar, and lightbox state
│       │   └── +page.ts      # Path validation and yearly data loading
│       ├── blog/             # Blog module
│       │   ├── (main)/       # Blog layout group
│       │   │   ├── +layout.ts    # Shared data loading
│       │   │   ├── +page.ts      # Blog-home type marker
│       │   │   ├── +page.svelte  # Blog article list
│       │   │   ├── search/       # Search page
│       │   │   │   ├── +page.ts      # Search-page type marker
│       │   │   │   └── +page.svelte
│       │   │   └── [...path]/    # Unified category, tag, and article route
│       │   │       ├── +page.ts      # Path validation and server Markdown rendering
│       │   │       └── +page.svelte  # Category list, tag filter, and article detail
│       ├── footprint/        # Footprint route
│       │   └── +page.svelte
│       ├── friends/          # Friend-links route
│       │   └── +page.svelte
│       ├── pay/              # Support route
│       │   └── +page.svelte
│       └── +error.svelte     # Global error page
├── static/                   # Allowlisted public static assets only
│   ├── favicon/              # Development/CI samples; production uses persistent assets
│   ├── fonts/                # Publicly distributable fonts
│   └── robots.txt            # Search-engine directives
├── tests/                    # Node.js project-integrity tests
│   ├── amap-loader.test.js # SDK loading, deduplication, failure recovery, and proxy configuration
│   ├── background-info.test.js # MTR topology, station selection, sequenced overlay, and Bing metadata
│   ├── background-loading.test.js # Footer alignment, background transactions, and rebuilds
│   ├── blog-newsroom.test.js # Newsroom grid, flat cards, reader typography, and background regressions
│   ├── config-boundary.test.js # Configuration, placeholders, duplicates, and path escapes
│   ├── content-deploy.test.js # Content release replacement, hard-link reuse, and atomic switching
│   ├── content-watcher.test.js # Content watching, GPS retention, and deployment constraints
│   ├── footprint-map.test.js # Native camera motion, interruption, and overlapping places
│   ├── github-repositories.test.js # Repository validation, safe links, and duplicate identities
│   ├── json-resource.test.js # Timeouts, cancellation, retries, and validated cached fallbacks
│   ├── statistics.test.js # Duplicate records, Other grouping, and valid totals
│   ├── public-data-cache.test.js # Node entry for the stdlib cache behavior suite
│   ├── public_data_cache_test.py # Refresh coalescing, persistence, stale recovery, and fixed routes
│   ├── home-components.test.js # Homepage component layout regressions
│   ├── markdown-rendering.test.js # Markdown HTML, links, math, and tables
│   ├── mobile-experience.test.js # Header, bottom dock, Wallet, and coding activity
│   ├── navigation-state.test.js # Header ownership, blog routes, and background policy
│   ├── public-permissions.test.js # Private-source and public-output permissions
│   ├── project-integrity.test.js
│   └── verify-build.js       # Production content, Newsroom/reader backgrounds, and Header checks
```

## Component Usage and Conventions

### Component Naming and Organization

1. **High cohesion and low coupling**: keep components self-contained, pass data through props, and reduce unnecessary global-state dependencies.
2. **Reuse first**: use atoms from `src/lib/components/ui`, such as `LiquidGlass` and `TextEffect`, for shared UI behavior.
3. **Style management**: prefer Tailwind CSS classes. Complex animation or behavior may use a component-local `<style>` block, but must not pollute global styles.

### Z-Index Layer Strategy

All z-index values are centralized as classes in `src/lib/styles/app.css`. **Never hard-code z-index values in component styles.**

| Layer          | Class           | Value | Purpose                                             |
| :------------- | :-------------- | :---- | :-------------------------------------------------- |
| **Loader**     | `.z-loader`     | 100   | Global loading and blocking overlays, highest layer |
| **Modal**      | `.z-modal`      | 60    | Drawers and dialogs                                 |
| **Controls**   | `.z-controls`   | 50    | Navigation, sidebars, and Header                    |
| **Mask**       | `.z-mask`       | 40    | Scroll fades and background overlays                |
| **Content**    | `.z-content`    | 20    | Primary page text and media                         |
| **Deep**       | `.z-deep`       | -10   | Low-level component decoration                      |
| **Background** | `.z-background` | -50   | Global background, lowest layer                     |

---

> **Note**: after adding or changing code files or directories, update both `PROJECT_STRUCTURE.md` and `PROJECT_STRUCTURE_ZH.md` in the same change.
