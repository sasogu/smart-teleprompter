# 🎬 Smart Teleprompter

A free, open-source teleprompter application that uses real-time speech recognition to automatically follow your voice as you read. Perfect for content creators, presenters, and anyone who needs a professional teleprompter solution.

**🌐 Live at [teleprompter.edutictac.es](https://teleprompter.edutictac.es)**

![Version](https://img.shields.io/badge/Version-2.2.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Vite](https://img.shields.io/badge/Vite-6-purple.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8.svg)

## ✨ Features

### 🎤 Voice Recognition

- **Real-time speech tracking** with 20+ language support
- **Automatic scrolling** that follows your voice
- **Word highlighting** as you speak
- **Smart matching** with configurable lookahead window (up to 40 words)
- **Interim results** for faster response
- **Co-host mode** — start a line with `>>` or `@Name:` to mark it as another
  speaker's: it renders dimmed and voice tracking automatically skips over it
  to your next line, no matter how long their part is

### 🎨 Customization

- **Adjustable font size** (16px - 80px)
- **Custom colors** for background, text, and highlights
- **Line height** and **paragraph spacing** controls
- **Text alignment** (left, center, right)
- **Mirror mode** for camera setups
- **Toolbar position** — place the control bar at the top or bottom of the screen
- **Text centering offset** (0vh–60vh) — slide text as close to the top as you need
- **Opacity controls** for text, aim marker, paragraph highlight, and UI buttons
- **Aim marker styles** — crosshair, dot, or camera-frame in 5 colors
- **Hideable "Listening" indicator** for clean on-camera recording

### 🔗 Offline

- **Installable PWA** — install from the browser for a standalone app window
- **Offline support** — the app shell is cached by a service worker;
  auto-scroll mode works with no internet at all

### 📱 User Experience

- **Responsive design** for mobile, tablet, and desktop
- **Fullscreen mode** for presentations
- **Keyboard shortcuts** for quick access
- **Script editor** with copy/clear functions
- **Script library** — save, name, edit, and load up to 50 scripts with per-script language
- **File import** from .txt and .md files
- **Settings persistence** with localStorage
- **Smooth animations** and transitions
- **Privacy first** — all data stays on your device

### 🌍 Multi-Language Support

- 🇺🇸 English (US/UK)
- 🇬🇷 Greek
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇮🇹 Italian
- 🇵🇹 Portuguese
- 🇳🇱 Dutch
- 🇸🇪 Swedish
- 🇳🇴 Norwegian
- 🇩🇰 Danish
- 🇫🇮 Finnish
- 🇵🇱 Polish
- 🇷🇺 Russian
- 🇨🇳 Chinese
- 🇯🇵 Japanese
- 🇰🇷 Korean
- 🇸🇦 Arabic
- 🇮🇳 Hindi
- 🇹🇷 Turkish

## 🚀 Quick Start

### Use Online

Visit **[teleprompter.edutictac.es](https://teleprompter.edutictac.es)** and click "🚀 Launch App".

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Voumellis/smart-teleprompter.git
cd smart-teleprompter

# Install and run
nvm use           # uses Node 22 from .nvmrc
npm install
npm run dev       # http://localhost:5173
```

### 📦 Build for Production

```bash
npm run build     # outputs to dist/
npm run preview   # preview the production build
```

## 🛠️ Tech Stack

- **React 19** — UI framework
- **Vite 6** — Build tool and dev server
- **Tailwind CSS 4** — Utility-first styling (landing page)
- **Vitest** — Unit testing
- **Web Speech API** — Browser-native voice recognition

## ⌨️ Keyboard Shortcuts

| Key | Action                   |
|-----|--------------------------|
| `V` | Start/Stop microphone    |
| `P` | Play/Pause auto-scroll   |
| `H` | Toggle word highlighting |
| `R` | Reset to beginning       |
| `L` | Language selection        |
| `E` | Settings menu            |
| `S` | Script editor            |
| `B` | My Scripts (in editor)   |
| `F` | Fullscreen mode          |
| `M` | Mirror text horizontally |
| `?` | Keyboard shortcuts panel |

## 🎯 How It Works

1. **Voice Input**: The app uses the Web Speech API to capture your voice
2. **Text Processing**: Your speech is converted to text and matched against the script
3. **Smart Scrolling**: The app automatically scrolls to keep your current position centered
4. **Visual Feedback**: Words are highlighted as you speak them
5. **Smooth Experience**: Optimized for natural reading flow

## 📋 Requirements

- **Modern web browser** with Web Speech API support
- **Microphone access** for voice recognition
- **HTTPS connection** (required for microphone access in production)

### ⚠️ Important Compatibility Notes

**For Best Experience:**

- 🖥️ **Use Desktop/Laptop** with Chrome browser
- 🌐 **Stable Internet Connection** recommended
- 🎤 **Microphone Access** required for voice recognition

**Mobile:**

- 📱 **iPhone/iPad (iOS 14.5+)**: Voice recognition works (Safari, Web Speech API), but may pause after each phrase — the app auto-restarts it. Auto-scroll mode (P) is the most reliable option on iOS.
- 📱 **Android**: Voice recognition may work but performance varies
- 🌐 **Mobile Browsers**: Limited Web Speech API support

**Browser Compatibility:**

- ✅ **Chrome/Chromium** (recommended — best performance)
- ✅ **Edge** (good performance)
- ⚠️ **Safari** (speech recognition supported on iOS 14.5+, may have intermittent pauses)
- ❌ **Firefox** (no Web Speech API support)

## 🔧 Configuration

### Voice Recognition Settings

- **Lookahead Window**: How many words ahead to search (8-15 recommended)
- **Language**: Select your preferred language for better accuracy
- **Interim Results**: Enable for faster response (recommended)

### Visual Settings

- **Font Size**: Adjust for your screen size and reading distance
- **Colors**: Customize background, text, and highlight colors
- **Spacing**: Fine-tune line height and paragraph spacing
- **Alignment**: Choose text alignment for your setup

### Performance Settings

- **Scroll Speed**: Adjust how fast the text scrolls
- **Center Padding**: Control text vertical position (0vh–60vh), down to completely flush with the top
- **Aim Indicator**: Show/hide the reading line indicator, customizable style and color

## 🏗️ Project Structure

```
├── index.html            Landing page
├── app.html              React app entry
├── vite.config.js        Vite configuration
├── src/
│   ├── App.jsx           Main teleprompter component
│   ├── main.jsx          React entry point
│   ├── landing.js        Landing page entry
│   └── styles/
│       └── index.css     Tailwind + custom styles
├── tests/                Vitest test suites
├── public/               Static assets, manifest, favicons
└── dist/                 Production build output
```

## 🚀 Deployment

The app is deployed exclusively to `teleprompter.edutictac.es` (VPS
aulessocarrades, nginx). The site is a plain static host: nginx `try_files`
falls back to `index.html`, `sw.js` is served normally, and the SPA routes
work.

Release process: bump the version in `package.json`, bump `CACHE_VERSION` in
`public/sw.js`, add a `CHANGELOG.md` entry, run `npm run test` and
`npm run build`, then `rsync -avz --delete dist/` to
`/var/www/teleprompter/`.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch
3. Make your changes and test
4. Submit a pull request

### Areas for Contribution

- 🌍 Additional language support
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📚 Documentation
- 🧪 Testing

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Web Speech API** for voice recognition capabilities
- **Heroicons** for beautiful SVG icons
- **React** for the component architecture
- **Open source community** for inspiration and support

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Voumellis/smart-teleprompter/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/Voumellis/smart-teleprompter/discussions)
- ☕ **Support Development**: [Buy Me a Coffee](https://buymeacoffee.com/nrjsoeq61)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Made with ❤️ for content creators worldwide**

_If you find this project helpful, please give it a ⭐ on GitHub!_
