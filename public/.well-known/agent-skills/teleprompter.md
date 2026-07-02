---
name: smart-teleprompter
version: 1.0.0
description: Control the Smart Teleprompter web app — load a script, drive auto-scroll or voice tracking, and adjust reading settings.
homepage: https://smarttelepromter.com/
license: MIT
---

# Smart Teleprompter

Smart Teleprompter is a free, open-source, browser-based teleprompter. It scrolls
a script for a reader/presenter and can automatically follow the reader's voice
using the Web Speech API, or scroll automatically at a set speed.

The application runs entirely in the browser (no backend, no account). When the
app page (`/app.html`) is open in an agent-capable browser, it exposes its
controls as **WebMCP** tools via `navigator.modelContext`. An agent should use
those tools to operate the teleprompter.

## Tools exposed on the app page

- `load_script` — replace the on-screen script with new text (optional `language`).
- `start_autoscroll` — begin automatic scrolling at the current speed.
- `start_voice_tracking` — start microphone voice tracking so scrolling follows speech.
- `stop` — stop scrolling/voice tracking and reset to the top.
- `set_speed` — set auto-scroll speed (1 slowest … 100 fastest).
- `set_font_size` — set font size in pixels (12–200).
- `set_language` — set the speech-recognition language (BCP-47, e.g. `en-US`, `el-GR`).
- `list_scripts` — list saved scripts in the local library.
- `load_saved_script` — load a saved script by name.
- `get_state` — return current playing/listening status, language, speed and font size.

## Typical flow

1. Open `https://smarttelepromter.com/app.html`.
2. Call `load_script` with the presenter's text (and language if not English).
3. Call `set_speed` / `set_font_size` to taste.
4. Call `start_autoscroll` (any device) or `start_voice_tracking` (desktop Chrome, mic permission required).
5. Call `stop` when finished.

## Notes

- Voice tracking needs microphone permission and works best in desktop Chrome.
  On iOS, only auto-scroll is available.
- All script content and settings are stored locally in the browser
  (`localStorage`); nothing is sent to a server.
