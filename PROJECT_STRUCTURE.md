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
│       └── fuyao-content-watcher.service # Unified article and photo watcher
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
│   ├── generate-blog-index.js # Generate blog indexes, RSS, and Sitemap
│   ├── generate-album-index.js# Generate EXIF indexes and responsive thumbnails
│   ├── prepare-build-inputs.js # Validate, copy, and freeze external favicon/content inputs
│   ├── prepare-content-update.js # Low-memory album preparation and pending state
│   ├── validate-deployment.js  # Input, artifact exposure, and public-read checks
│   ├── audit-repository.js     # Privacy scan for current files and complete Git history
│   ├── migrate-content.js      # External persistent-content copy with SHA-256 manifest
│   ├── deploy.js               # Independent releases, atomic switching, and rollback
│   ├── watch-content.js       # Recursive article/photo watcher with event coalescing
│   └── update-version.js      # Version validation, synchronization, and Build Train formatting
├── src/
│   ├── app.d.ts          # TypeScript declarations
│   ├── app.html          # HTML template
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
│   │   │   └── mosaic.ts     # Mosaic background configuration
│   │   ├── plugins/          # Vite plugins
│   │   │   └── vite-plugin-blog-watcher.ts # Development blog-file watcher
│   │   ├── hooks/            # Svelte composable hooks
│   │   │   └── useBlogState.svelte.ts # Blog state-management hook
│   │   ├── stores/           # Global state management
│   │   │   ├── app.svelte.ts     # App state with reentrant background transactions and strict Header slots
│   │   │   ├── lightbox.svelte.ts# Lightbox state using Svelte 5 Runes
│   │   │   ├── mosaic.svelte.ts  # Mosaic background state
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
│   │   │   │       ├── AMap.svelte           # AMap entry point
│   │   │   │       ├── MapCopyright.svelte   # Map attribution
│   │   │   │       ├── MapInfoWindow.svelte  # Map information window
│   │   │   │       ├── types.ts              # Map types
│   │   │   │       └── core/                 # Map core logic
│   │   │   │           ├── copyright.ts          # Attribution utilities
│   │   │   │           ├── infoWindowController.svelte.ts # Information-window controller
│   │   │   │           ├── loader.ts             # AMap loader
│   │   │   │           ├── markers.ts            # Marker management
│   │   │   │           ├── placeSearch.ts        # Place search
│   │   │   │           ├── view.ts               # View utilities
│   │   │   │           └── viewController.svelte.ts # View controller
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
│   │   │   ├── blog/         # Blog page components
│   │   │   │   ├── card/         # Article cards
│   │   │   │   │   ├── FeaturedPostCard.svelte # Featured article card
│   │   │   │   │   ├── GridPostCard.svelte  # Grid article card
│   │   │   │   │   ├── ListPostCard.svelte  # List article card
│   │   │   │   │   └── PostCard.svelte      # Unified article-card entry point
│   │   │   │   ├── common/       # Shared small components
│   │   │   │   │   ├── CategoryBadge.svelte # Category badge
│   │   │   │   │   └── TagBadge.svelte      # Unified pill tag
│   │   │   │   ├── home/         # Blog home view
│   │   │   │   │   ├── EmptyState.svelte    # Empty article state
│   │   │   │   │   └── Home.svelte          # Blog home entry point
│   │   │   │   ├── search/       # Search view
│   │   │   │   │   └── Search.svelte        # Blog search page
│   │   │   │   ├── sidebar/      # Blog sidebar
│   │   │   │   │   ├── Sidebar.svelte       # Archives and categories
│   │   │   │   │   └── TagCloud.svelte      # Tag cloud
│   │   │   │   ├── viewer/       # Article reader
│   │   │   │   │   ├── BackButton.svelte    # Return-to-list button
│   │   │   │   │   ├── Header.svelte        # Article title and metadata
│   │   │   │   │   ├── LinkPreview.svelte   # Link preview
│   │   │   │   │   ├── MarkdownRenderer.svelte # Markdown renderer
│   │   │   │   │   ├── TableOfContents.svelte # Article table of contents
│   │   │   │   │   └── Viewer.svelte        # Reader entry point
│   │   │   │   └── header/       # Header integration
│   │   │   │       ├── Actions.svelte        # Search and RSS action group
│   │   │   │       ├── RssButton.svelte      # RSS button
│   │   │   │       └── SearchButton.svelte   # Search button
│   │   │   ├── layout/       # Layout components
│   │   │   │   ├── background/   # Background components
│   │   │   │   │   └── BackgroundLayer.svelte # Responsive Bing wallpaper with two-stage fallback
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
│   │   │   │   │   └── MobileNav.svelte      # Six equal-width floating direct tabs
│   │   │   │   ├── loader/       # Loading indicators
│   │   │   │   │   └── GlobalLoader.svelte   # Initial background and canvas-rebuild overlay
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
│   │   │       │   ├── BingWallpaperInfo.svelte # Single-line Bing daily-wallpaper attribution
│   │   │       │   ├── FlowingBackground.svelte # Flowing gradient
│   │   │       │   ├── MosaicBackground.svelte  # Debounced mosaic drawing and failure fallback
│   │   │       │   ├── MosaicInfo.svelte        # Mosaic station attribution
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
│   │       │   ├── exif.ts           # Shared album-grid/lightbox EXIF formatting
│   │       │   ├── footprintYaml.ts  # Footprint YAML generation
│   │       │   ├── footprints.ts     # Footprint data processing
│   │       │   ├── loader.ts         # Data loaders
│   │       │   ├── map.ts            # Map links and GCJ-02/WGS-84 conversion
│   │       │   ├── markdown.ts       # Markdown AST parsing, sanitization, and enhancement
│   │       │   └── nav.ts            # Navigation utilities
│   │       ├── effect/       # Visual-effect utilities
│   │       │   ├── appearanceTransition.svelte.ts # View Transition detection and Crossfade fallback
│   │       │   ├── glassCompositor.svelte.ts # Shared on-demand two-level WebGL2 Gaussian blur
│   │       │   └── liquidGlass.ts # Size-aware single-channel SVG refraction filters
│   │       ├── format/       # Content formatting
│   │       │   ├── number.ts         # Number formatting
│   │       │   └── slugify.ts        # Slug normalization
│   │       ├── network/      # Network and loading
│   │       │   ├── loading.ts        # Request-loading state
│   │       │   └── urlMetadata.ts    # URL metadata retrieval
│   │       ├── state/        # State-ownership utilities
│   │       │   └── headerOwnership.ts # Non-empty Header registration-ID ownership
│   │       └── index.ts      # Utility exports
│   └── routes/               # SvelteKit routes
│       ├── +layout.svelte    # Global Header and Sidebar layout
│       ├── +layout.ts        # Client-compatible shared loading logic
│       ├── +page.svelte      # Homepage entry point
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
│   ├── background-loading.test.js # Footer alignment, background transactions, and rebuilds
│   ├── config-boundary.test.js # Configuration, placeholders, duplicates, and path escapes
│   ├── content-watcher.test.js # Content watching, GPS retention, and deployment constraints
│   ├── home-components.test.js # Homepage component layout regressions
│   ├── markdown-rendering.test.js # Markdown HTML, links, math, and tables
│   ├── mobile-experience.test.js # Header, bottom dock, Wallet, and coding activity
│   ├── navigation-state.test.js # Header ownership, blog routes, and background policy
│   ├── public-permissions.test.js # Private-source and public-output permissions
│   ├── project-integrity.test.js
│   └── verify-build.js       # Production content, reader background, and Header checks
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
