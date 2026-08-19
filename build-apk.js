const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Web Assets & Capacitor Sync...');
execSync('npm run cap:sync', { stdio: 'inherit' });

console.log('📦 Compiling Android APK with Gradle & JDK 17...');

const env = { ...process.env };
if (fs.existsSync('C:/Users/Admin/.jdks/jdk-17.0.20+8')) {
  env.JAVA_HOME = 'C:/Users/Admin/.jdks/jdk-17.0.20+8';
  env.PATH = `${path.join(env.JAVA_HOME, 'bin')};${env.PATH}`;
}
if (fs.existsSync('C:/Users/Admin/AppData/Local/Android/Sdk')) {
  env.ANDROID_HOME = 'C:/Users/Admin/AppData/Local/Android/Sdk';
}

const gradlew = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
execSync(`${gradlew} --no-daemon assembleDebug`, {
  cwd: path.join(__dirname, 'android'),
  stdio: 'inherit',
  env
});

const generatedApk = path.join(__dirname, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const targetApk = path.join(__dirname, 'Calculator-Pro-debug.apk');

if (fs.existsSync(generatedApk)) {
  fs.copyFileSync(generatedApk, targetApk);
  console.log(`\n🎉 Android APK Successfully Built!`);
  console.log(`📍 Output File: ${targetApk}`);
} else {
  console.error('❌ Could not find generated APK at ' + generatedApk);
  process.exit(1);
}
