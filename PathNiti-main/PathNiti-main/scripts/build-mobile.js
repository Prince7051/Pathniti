#!/usr/bin/env node

/**
 * Mobile App Build Script
 * Automates the mobile app build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    log(`\n${colors.cyan}Executing: ${command}${colors.reset}`);
    execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      ...options 
    });
    return true;
  } catch (error) {
    log(`\n${colors.red}Error executing: ${command}${colors.reset}`);
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');
  
  // Check if Node.js is installed
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`✅ Node.js: ${nodeVersion}`, 'green');
  } catch (error) {
    log('❌ Node.js is not installed', 'red');
    return false;
  }

  // Check if npm is installed
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`✅ npm: ${npmVersion}`, 'green');
  } catch (error) {
    log('❌ npm is not installed', 'red');
    return false;
  }

  // Check if Capacitor CLI is installed
  try {
    execSync('npx cap --version', { stdio: 'pipe' });
    log('✅ Capacitor CLI is available', 'green');
  } catch (error) {
    log('❌ Capacitor CLI is not available', 'red');
    return false;
  }

  return true;
}

function checkEnvironment() {
  log('\n🔧 Checking environment configuration...', 'blue');
  
  // Check if .env.capacitor exists
  const envFile = path.join(process.cwd(), '.env.capacitor');
  if (!fs.existsSync(envFile)) {
    log('⚠️  .env.capacitor not found. Using example file...', 'yellow');
    const exampleFile = path.join(process.cwd(), 'env.capacitor.example');
    if (fs.existsSync(exampleFile)) {
      fs.copyFileSync(exampleFile, envFile);
      log('✅ Created .env.capacitor from example', 'green');
    } else {
      log('❌ env.capacitor.example not found', 'red');
      return false;
    }
  } else {
    log('✅ .env.capacitor found', 'green');
  }

  return true;
}

function buildWebApp() {
  log('\n🏗️  Building web application...', 'blue');
  
  // Set environment variable for mobile build
  process.env.CAPACITOR_BUILD = 'true';
  
  if (!exec('npm run build')) {
    log('❌ Web app build failed', 'red');
    return false;
  }
  
  log('✅ Web app built successfully', 'green');
  return true;
}

function syncPlatform(platform) {
  log(`\n📱 Syncing ${platform} platform...`, 'blue');
  
  if (!exec(`npx cap sync ${platform}`)) {
    log(`❌ ${platform} sync failed`, 'red');
    return false;
  }
  
  log(`✅ ${platform} synced successfully`, 'green');
  return true;
}

function openPlatform(platform) {
  log(`\n🚀 Opening ${platform} in IDE...`, 'blue');
  
  if (!exec(`npx cap open ${platform}`)) {
    log(`❌ Failed to open ${platform}`, 'red');
    return false;
  }
  
  log(`✅ ${platform} opened successfully`, 'green');
  return true;
}

function runPlatform(platform) {
  log(`\n🏃 Running ${platform} app...`, 'blue');
  
  if (!exec(`npx cap run ${platform}`)) {
    log(`❌ Failed to run ${platform}`, 'red');
    return false;
  }
  
  log(`✅ ${platform} app running`, 'green');
  return true;
}

function showHelp() {
  log('\n📖 PathNiti Mobile App Build Script', 'bright');
  log('Usage: node scripts/build-mobile.js [command] [platform]', 'cyan');
  log('\nCommands:', 'yellow');
  log('  build [android|ios]  - Build and sync for specified platform');
  log('  sync [android|ios]   - Sync web app to native platform');
  log('  open [android|ios]   - Open platform in IDE');
  log('  run [android|ios]    - Run app on device/emulator');
  log('  help                 - Show this help message');
  log('\nExamples:', 'yellow');
  log('  node scripts/build-mobile.js build android');
  log('  node scripts/build-mobile.js sync ios');
  log('  node scripts/build-mobile.js open android');
  log('  node scripts/build-mobile.js run ios');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const platform = args[1];

  log('🚀 PathNiti Mobile App Build Script', 'bright');
  log('=====================================', 'bright');

  if (!command || command === 'help') {
    showHelp();
    return;
  }

  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites check failed', 'red');
    process.exit(1);
  }

  if (!checkEnvironment()) {
    log('\n❌ Environment check failed', 'red');
    process.exit(1);
  }

  let success = true;

  switch (command) {
    case 'build':
      if (!platform || !['android', 'ios'].includes(platform)) {
        log('❌ Please specify platform: android or ios', 'red');
        process.exit(1);
      }
      
      success = buildWebApp() && syncPlatform(platform);
      if (success) {
        log(`\n🎉 ${platform} build completed successfully!`, 'green');
        log(`\nNext steps:`, 'yellow');
        log(`1. Run: node scripts/build-mobile.js open ${platform}`, 'cyan');
        log(`2. Or run: node scripts/build-mobile.js run ${platform}`, 'cyan');
      }
      break;

    case 'sync':
      if (!platform || !['android', 'ios'].includes(platform)) {
        log('❌ Please specify platform: android or ios', 'red');
        process.exit(1);
      }
      
      success = syncPlatform(platform);
      break;

    case 'open':
      if (!platform || !['android', 'ios'].includes(platform)) {
        log('❌ Please specify platform: android or ios', 'red');
        process.exit(1);
      }
      
      success = openPlatform(platform);
      break;

    case 'run':
      if (!platform || !['android', 'ios'].includes(platform)) {
        log('❌ Please specify platform: android or ios', 'red');
        process.exit(1);
      }
      
      success = runPlatform(platform);
      break;

    default:
      log(`❌ Unknown command: ${command}`, 'red');
      showHelp();
      process.exit(1);
  }

  if (!success) {
    log('\n❌ Build process failed', 'red');
    process.exit(1);
  }

  log('\n✅ All done!', 'green');
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n⚠️  Build process interrupted', 'yellow');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️  Build process terminated', 'yellow');
  process.exit(0);
});

// Run the main function
main();
