# Changelog

All notable changes to Smart Teleprompter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.3] - 2026-08-12

### Changed

- Removed the whole-script far re-sync: a repeated phrase in a distant paragraph could trigger a jump of several paragraphs, which is unacceptable during a live reading. The re-sync now never leaves the next paragraph (bounded to 200 words); if there is no local match the tracker simply does not move. Use R (reset) or the toolbar to reposition manually.
- Service worker cache bumped to `v6`.

## [2.4.2] - 2026-08-12

### Fixed

- Phrase-skip re-sync restored: the strict 3-gram of 2.4.1 made real skips fail because speech recognition rarely transcribes three words exactly. The near paragraph search now accepts a 3-gram with one soft-matched word (2 exact + 1 prefix/contains), so a skipped phrase re-syncs despite recognition errors while a repeated 2-gram still never causes a jump.
- Service worker cache bumped to `v5`.

## [2.4.1] - 2026-08-12

### Fixed

- Phrase-skip re-sync no longer jumps to the next paragraph on a repeated 2-gram (e.g. a common phrase appearing in two paragraphs). The near paragraph search now requires an exact 3-gram.
- Service worker cache bumped to `v4`.

## [2.4.0] - 2026-08-12

### Changed

- Phrase-skip re-sync is now limited to the next paragraph (lines separated by a blank line), so skipping a phrase re-syncs locally instead of jumping to a distant section. A strict 3-gram search over the whole script still runs as a last resort for multi-paragraph skips.
- Service worker cache bumped to `v3` so installed PWAs drop stale assets on the next launch.

## [2.3.0] - 2026-08-12

### Added

- Toolbar position setting: the control bar can now be placed at the top or bottom of the screen, persisted in settings.
- Text centering offset slider now goes down to 0vh, allowing text to be placed flush with the top of the viewport (was 20vh minimum).
- Alternative deployment at `teleprompter.edutictac.es` (nginx on aulessocarrades VPS) documented in README.
- Markdown imports now render as teleprompter-friendly text: headings, lists, quotes, links, inline code, emphasis, and code blocks are cleaned up for reading while the editor keeps the original Markdown source.
- The Script Editor now exposes the existing `.txt`/`.md`/`.markdown` file import control through an Import button.
- Voice recognition now shows visible microphone diagnostics instead of silently restarting when Chrome reports no speech, missing microphone input, blocked permissions, or speech service errors.
- Settings now include a Support prompts toggle that hides Buy Me a Coffee buttons and support messages across the app and landing page.
- The teleprompter app now has an interface language setting for English and Spanish, independent from the speech-recognition language.
- File imports (.txt/.md) now automatically open the Add Script dialog pre-filled with the filename and imported content — one click to save to the script library.
- The app version (from `package.json`) is now shown at the bottom of the keyboard-shortcuts panel.

### Changed

- **Refactored monolith**: extracted 9 modules from `App.jsx` (5138 → 4445 lines, -693). Constants (`icons`, `speechErrors`, `keys`), i18n (`translations`), utilities (`markdown`, `matching`, `autoScroll`), and components (`IconButton`, `TeleprompterLine`) now live in separate files. Build and tests remain green.
- Voice recognition is no longer hard-blocked on iOS. On iOS 14.5+ (Safari/WebKit) it now attempts to use the Web Speech API with automatic restart on pause. A dismissible info banner replaces the old error banner.
- Settings sliders (font size, speed, opacities, offsets, etc.) now use the Pointer Events API instead of mouse-only listeners, so dragging them works on touch devices, not just with a mouse.
- The Share button has been hidden from the script library UI — the sharing feature and `/api/share` endpoint remain in the codebase for Cloudflare Pages deployments.
- Service worker cache bumped to `v2` so installed PWAs drop stale assets on the next launch.

### Fixed

- Opening a shared script link (`?share=`) no longer silently saves the script to your library and loads it — a confirmation dialog now appears first.
- `POST /api/share` is now rate-limited per IP (20 shares/hour) to prevent abuse of the free KV write quota.
- **Voice tracking re-syncs after skipping a phrase**: if the speaker jumps ahead, the tracker now matches the accumulated transcript of the current speech result further down the script and jumps to the real position. Previously it only searched the current line plus a short lookahead window and got stuck; now it works even during fluent reading with no pauses (a ≥4-char word is required in the n-gram to avoid false jumps on repeated filler pairs).

## [2.2.0] - 2026-07-02

### Added

- 🎭 **Co-Host Mode**: Start a line with `>>` or `@Name:` to mark it as another speaker's — it renders dimmed and voice tracking skips over it to your next line regardless of its length. Toggleable in Settings (GitHub #2)
- 🎯 **Aim Marker Styles**: Choose crosshair, dot, or camera-frame marker in 5 colors (yellow, blue, red, green, white) — community request from r/elgato
- 🔴 **Hideable "Listening" Indicator**: New setting hides the red pill during recording for a clean on-camera view — community request from r/elgato
- 🏠 **Landing Page**: New feature cards for Share via Link and Offline/Installable, plus an install-as-app tip

### Changed

- ⚡ **Snappier Word Highlight**: Highlight transition reduced 0.2s → 0.1s after feedback that word marking felt sluggish
- 🔭 **Wider Lookahead Range**: Lookahead window slider max raised from 20 to 40 words so voice tracking can skip over a co-host's lines in shared scripts (GitHub #2)

### Fixed

- 🐛 **Tooltip Position**: Toolbar tooltips drifted toward mid-screen once the script had scrolled (visible in the installed PWA) — fixed-position tooltips were offset by `window.scrollY`
- 📱 **Tooltips on Touch Devices**: No longer shown — they only appeared after the tap had already fired and referenced keyboard shortcuts that don't exist on mobile
- ↔️ **Tooltip Clipping**: Tooltips near the screen edge (e.g. leftmost toolbar buttons) now shift to stay fully visible
- 📱 **Toolbar Overflow Hints**: On narrow screens, tappable arrow buttons with edge fades now show when more toolbar icons are hidden off-screen — previously nothing indicated the toolbar scrolls horizontally

## [2.1.0] - 2026-07-02

### Added

- 🔗 **Share Scripts via Link**: New Share button in the script library creates a link (`?share=<id>`) that opens the script on any device. Backed by a Cloudflare Pages Function + KV (free tier); shares auto-expire after 30 days
- 📴 **Offline Support / Installable PWA**: New service worker caches the app shell and hashed assets — auto-scroll mode now works fully offline (ideal for iPhone/iPad where it is the only mode), and the app can be installed from the browser
- ⚙️ **CI Pipeline**: GitHub Actions workflow runs tests and a production build on every push/PR

### Changed

- 🖼️ **Icons Inlined**: Toolbar icons are now inline SVG instead of being fetched from unpkg.com — zero external requests, instant rendering, works offline
- ⚡ **Rendering Performance**: Script lines are memoized; a speech-recognition result now re-renders only the affected lines instead of every word span (large scripts stay smooth)
- 💾 **Settings Persistence**: Debounced (400ms) — no more full-settings serialization on every keystroke
- 📊 **Analytics**: Replaced Google Analytics with cookieless Cloudflare Web Analytics; landing-page privacy text updated accordingly
- 🔒 **CSP Tightened**: Removed unpkg.com, googletagmanager.com, and google-analytics.com from the Content-Security-Policy

### Fixed

- 🐛 **Settings Not Saving**: `language` and `mirrorX` were missing from the persistence dependency list — changing only them was never saved
- 🌐 **Greek Alert in English UI**: "Speech recognition not supported" message is now in English and suggests auto-scroll mode
- 🧹 **Dead Code Removed**: Non-functional `renderMarkdown` state (including a call that could crash file import) and the obsolete Apache `.htaccess`
- 🏷️ **Version Mismatch**: package.json, README badge, and JSON-LD `softwareVersion` now report the real version

## [2.0.1] - 2026-03-30

### Fixed

- 🔧 **Public Assets Deployed**: Fixed `.gitignore` excluding `public/` directory — favicons, robots.txt, sitemap.xml, manifest, `_headers`, and OG image were never being deployed
- 🖼️ **Social Share Image**: Fixed `og:image` and `twitter:image` URLs pointing to non-existent GitHub raw path
- ♿ **Accessibility**: Added `<main>` landmark to landing page and app
- ♿ **Contrast**: Improved Edit button contrast in script library
- 🔒 **Security Headers**: Added `Strict-Transport-Security`, `Cross-Origin-Opener-Policy`, and `Content-Security-Policy` headers
- 🐛 **Broken HTML**: Fixed mismatched `<h2>...</p>` tag in landing page footer
- 🔁 **Redirect Loop**: Removed `_redirects` rewrite rule that conflicted with Cloudflare Pages' built-in pretty URLs

## [2.0.0] - 2026-03-30

### Added

- 📚 **Script Library**: Save, edit, load, and delete up to 50 scripts with per-script language
- ⌨️ **Keyboard Shortcuts Modal**: Press `?` to view all shortcuts
- 🔑 **New Shortcut `B`**: Open My Scripts panel from the editor
- ✅ **Delete Confirmation Modal**: Prevents accidental script deletion
- ✅ **Reset Settings Confirmation Modal**: Prevents accidental settings reset
- 🧪 **Test Suite**: 9 Vitest tests covering app rendering, settings persistence, and script library
- 📦 **Vite 6 Build Pipeline**: Replaced CDN/Babel with proper build tooling
- 🎨 **Tailwind CSS 4**: Installed via `@tailwindcss/vite` plugin (CSS-first config)
- 📄 **Structured Data**: JSON-LD `SoftwareApplication` schema for rich search results
- 🔍 **SEO Improvements**: Optimized meta tags, keywords, OG/Twitter descriptions
- 📊 **Google Analytics**: Tracking integration
- 🛠️ **Node Version Files**: `.nvmrc` and `.node-version` (Node 22)

### Changed

- 🌐 **Default Language**: Set to English (en-US) instead of browser locale
- 🏗️ **Build System**: Migrated from CDN scripts to Vite + React 19 + Tailwind CSS 4
- 📁 **Static Assets**: Moved to `public/` directory
- 🔗 **All URLs**: Corrected to `smarttelepromter.com`
- 📖 **README**: Full rewrite with features, shortcuts, compatibility, project structure
- 🌐 **Landing Page**: Added Script Library feature card, keyboard shortcuts, SEO footer text
- ⚡ **Bundle Size**: Reduced from ~2.5MB (Babel standalone) to ~73KB gzipped

### Fixed

- 🐛 **Auto-scroll Tooltip Bug**: Icon/IconButton components moved outside render to prevent unmount/remount on re-render
- 🔗 **Broken URLs**: Fixed repository URL typos across all files
- 📋 **Sitemap**: Corrected URLs and updated lastmod date

### Removed

- 📄 **PDF.js**: Removed PDF import (was lazy-loaded, unnecessary)
- 📝 **Marked + DOMPurify**: Removed Markdown rendering dependencies
- 🔧 **Babel Standalone**: Replaced by Vite build
- 🧶 **Yarn Artifacts**: Cleaned up accidental yarn files

### Migration

- Existing script text in `tp_settings_v1` is automatically migrated to the script library on first load

## [1.0.0] - 2025-10-05

### Added

- 🎤 **Voice Recognition**: Real-time speech tracking with 20+ language support
- 🎯 **Auto-scrolling**: Automatic text scrolling that follows your voice
- ✨ **Word Highlighting**: Visual feedback as you speak each word
- 🎨 **Customization**: Font size, colors, spacing, and alignment controls
- 📱 **Responsive Design**: Works on mobile, tablet, and desktop
- 🌍 **Multi-language Support**: 20+ languages
- ⌨️ **Keyboard Shortcuts**: Quick access to all features (V, P, H, R, L, E, S, F, M)
- 📝 **Script Editor**: Built-in text editor with copy/clear functions
- 🔧 **Settings Panel**: Comprehensive configuration options
- 💾 **Settings Persistence**: localStorage integration for user preferences
- 🖥️ **Fullscreen Mode**: Professional presentation mode
- 🪞 **Mirror Mode**: Horizontal text mirroring for camera setups
- 🎯 **Aim Indicator**: Visual reading line indicator with offset controls
- ☕ **Support Integration**: Buy Me a Coffee button

---

## Version History

- **2.0.1** (2026-03-30): Lighthouse fixes, deploy public assets, security headers
- **2.0.0** (2026-03-30): Vite migration, script library, SEO improvements
- **1.0.0** (2025-10-05): Initial release with core functionality
