const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const distDir = path.join(__dirname, 'www');

const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icon.svg'
];

console.log('🚀 Building and copying web assets to Capacitor webDir (www)...');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

let copiedCount = 0;
for (const file of filesToCopy) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(distDir, file);

  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`  ✓ Copied ${file} -> www/${file}`);
    copiedCount++;
  } else {
    console.warn(`  ⚠ Warning: ${file} not found in root directory.`);
  }
}

console.log(`✨ Build complete! ${copiedCount} files copied to www/ directory.`);
