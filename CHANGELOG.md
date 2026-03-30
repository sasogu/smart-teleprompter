# Changelog

All notable changes to Smart Teleprompter will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- **2.0.0** (2026-03-30): Vite migration, script library, SEO improvements
- **1.0.0** (2025-10-05): Initial release with core functionality
