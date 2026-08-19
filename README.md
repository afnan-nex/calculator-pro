# Calculator Pro 📱✨

A complete, responsive, and modern calculator mobile web application built with vanilla web technologies, optimized for mobile WebViews and ready for native bundling into an Android APK with **Capacitor**.

---

## 🌟 Key Features

### 1. **Core Mathematics & Evaluation Engine**
- **Standard Arithmetic**: Addition (`+`), Subtraction (`−`), Multiplication (`×`), Division (`÷`), and Percentage (`%`).
- **Scientific Suite**: Trigonometric functions (`sin`, `cos`, `tan`, `sin⁻¹`, `cos⁻¹`, `tan⁻¹`), Degrees (`DEG`) & Radians (`RAD`) mode toggle, Square Root (`√`), Cube Root (`∛`), Powers (`x²`, `x³`, `xʸ`), Logarithms (`ln`, `log₁₀`), Constants ($\pi$, $e$), Factorials ($n!$), Reciprocals ($1/x$), and Parentheses.
- **Smart Precision Arithmetic**: Eliminates classic floating point quirks (e.g., `0.1 + 0.2 = 0.3`).
- **Live Result Preview**: Evaluates expressions in real-time as you type before pressing `=`.
- **Intelligent Syntax Auto-Formatting**: Automatic implicit multiplication (e.g., `5(2) = 10`, `5π`), parenthesis auto-balancing, and error prevention for double decimals or invalid operator sequences.

### 2. **Mobile UX & Capacitor Readiness**
- **Safe-Area Inset Support**: Adapts automatically to modern Android display cutouts and navigation bars (`env(safe-area-inset-*)`).
- **No-Zoom & Touch Optimized**: Viewport configuration locks pinch-to-zoom and text selection (`user-select: none`, `touch-action: manipulation`).
- **Tactile Haptic & Audio Feedback**: Native `navigator.vibrate` haptics on mobile devices and zero-asset synthesized mechanical clicks via the Web Audio API.
- **Dynamic Display Resizing**: Automatically adjusts font sizes for long numbers to prevent screen overflow.
- **Copy to Clipboard**: Quick tap on the result or Copy button with toast notifications.
- **Offline Calculation History**: Slide-up bottom sheet drawer with persistent storage (`localStorage`), timestamps, single item deletion, and tap-to-reuse results.

---

## 📁 Project Structure

```
calculator apk/
├── index.html            # Main semantic single-page layout
├── styles.css            # Dark OLED responsive design system & animations
├── app.js                # Math engine, state machine, history & audio
├── capacitor.config.json # Capacitor app configuration (webDir: "www")
├── package.json          # NPM scripts for building, testing & syncing
├── build.js              # Cross-platform build script to sync to www/
├── test.js               # Unit test suite for math parser
├── manifest.json         # PWA Web App Manifest
├── icon.svg              # Vector app icon
└── www/                  # Synced distribution directory for Capacitor
    ├── index.html
    ├── styles.css
    ├── app.js
    ├── manifest.json
    └── icon.svg
```

---

## ⌨️ Desktop Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `0` - `9` | Input Number |
| `.` | Decimal Point |
| `+`, `-`, `*`, `/` | Arithmetic Operators (`+`, `−`, `×`, `÷`) |
| `^` | Power ($x^y$) |
| `%` | Percentage |
| `(`, `)` | Parentheses |
| `Enter` or `=` | Calculate / Equals |
| `Backspace` | Delete last character / token |
| `Escape` or `c` | All Clear (`AC`) |
| `s` | Toggle Scientific / Basic Mode |
| `h` | Open / Close History Drawer |

---

## 🚀 Quick Start (Local Web Server)

Run the included lightweight zero-dependency local server:

```bash
npm run serve
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

To run the automated math unit test suite:
```bash
npm test
```

---

## 📦 Building Android APK with Capacitor

To package this application into a native Android APK using Capacitor, follow these simple steps:

### ⚡ One-Step APK Build (Direct Build):
```bash
npm run build:apk
```
*This command automatically tests, syncs web assets to `www/`, compiles the Android native project with Gradle, and saves `Calculator-Pro-debug.apk` directly in the project root!*

---

### Step-by-Step Manual Workflow:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Add the Android Platform
```bash
npm run cap:add:android
```
*This initializes the `android/` native project folder.*

### Step 3: Build & Sync Web Assets
```bash
npm run cap:sync
```
*This runs `node build.js` and syncs all files in `www/` into the Android native assets directory.*

### Step 4: Open in Android Studio & Generate APK
```bash
npm run cap:open:android
```

In Android Studio:
1. Go to **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Once the build finishes, click **locate** to find your `.apk` file ready to install on any Android device!

Alternatively, run directly on a connected device or emulator:
```bash
npm run cap:run:android
```
