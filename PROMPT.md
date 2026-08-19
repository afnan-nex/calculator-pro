Create a complete, responsive, and modern calculator web application ready for mobile bundling with Capacitor.

### Project Structure & Requirements:
1. **Single-Page Architecture**:
   - `index.html`: Clean semantic layout containing the calculator display (current expression and live result preview), keypad grid, and mode toggles.
   - `styles.css`: Modern dark-mode UI with smooth button press animations, CSS grid layout, haptic-like active states, and mobile-friendly touch targets.
   - `app.js`: Pure vanilla JavaScript handling math evaluation, input sanitation, edge cases (e.g., division by zero, multiple decimals), keyboard input support, and calculation history.

2. **Core Features**:
   - Standard arithmetic operations (`+`, `-`, `×`, `÷`, `%`).
   - Clear (`C`), All Clear (`AC`), Backspace/Delete, and Sign Toggle (`±`).
   - Calculation history panel saved locally via `localStorage`.
   - Responsive layout optimized for mobile WebView viewports (disable user pinch-to-zoom and text selection).

3. **Capacitor Readiness**:
   - Include standard meta tags for mobile viewports (`width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no`).
   - Ensure all assets use relative paths for seamless local bundling inside the `www` or `dist` directory.
   - Provide a minimal `package.json` with scripts to build and sync to Capacitor Android.