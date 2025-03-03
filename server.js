const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { spawn, exec } = require('child_process');
const path = require('path');
const chokidar = require('chokidar');
const fs = require('fs');

// Check if we're in development mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Track build status
let isBuilding = false;
let needsRestart = false;
let buildCount = 0;
let lastBuildTime = Date.now();
const BUILD_COOLDOWN = 10000; // 10 seconds cooldown between restarts

// Function to run the clean-restart script
const runCleanRestart = () => {
  console.log('\n🔄 Detected build completion. Running clean-restart script...');
  
  // On Windows, use PowerShell to run the script
  const command = 'powershell -ExecutionPolicy Bypass -File ./clean-restart.ps1';
  
  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running clean-restart script: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`⚠️ Script stderr: ${stderr}`);
    }
    console.log(`✅ Clean-restart script output: ${stdout}`);
  });
};

// Fix problematic modules before starting
const fixProblematicModules = () => {
  console.log('🔧 Fixing problematic modules before starting...');
  
  // Fix the Linux module issue
  const linuxModulePath = path.join(__dirname, 'node_modules', '@next', 'swc-linux-x64-musl');
  
  try {
    if (fs.existsSync(linuxModulePath)) {
      // Remove the problematic directory
      fs.rmSync(linuxModulePath, { recursive: true, force: true });
      console.log('✅ Removed problematic Linux module.');
      
      // Create empty directory with package.json to prevent errors
      fs.mkdirSync(linuxModulePath, { recursive: true });
      fs.writeFileSync(path.join(linuxModulePath, 'package.json'), '{}');
      console.log('✅ Created placeholder package.json in Linux module directory.');
    }
  } catch (error) {
    console.error(`❌ Error fixing modules: ${error.message}`);
  }
};

// Watch for changes in the build directories using chokidar
const watchBuildDirectories = () => {
  const buildDirs = [
    path.join(__dirname, 'dev-build'),
    path.join(__dirname, '.next')
  ];
  
  // Initialize watcher
  const watcher = chokidar.watch(buildDirs, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      '**/node_modules/**', // ignore node_modules
      '**/.git/**' // ignore git
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    },
    usePolling: true,
    interval: 1000
  });
  
  // Add event listeners
  watcher
    .on('add', handleFileChange)
    .on('change', handleFileChange)
    .on('unlink', handleFileChange);
  
  console.log('📡 Watching build directories for changes:', buildDirs);
  
  // Handle file changes
  function handleFileChange(filePath) {
    // Ignore certain files that change frequently but don't indicate a build completion
    if (filePath.includes('webpack-runtime') || 
        filePath.includes('hot-update') || 
        filePath.includes('.log')) {
      return;
    }
    
    // Only trigger if we're not already building and enough time has passed
    const now = Date.now();
    if (!isBuilding && now - lastBuildTime > BUILD_COOLDOWN) {
      isBuilding = true;
      buildCount++;
      console.log(`\n🔨 Build activity detected (${buildCount}): ${path.basename(filePath)}`);
      
      // Set a timeout to avoid multiple restarts for the same build
      setTimeout(() => {
        isBuilding = false;
        lastBuildTime = Date.now();
        
        // Only restart if we're not in the middle of another build
        if (needsRestart) {
          needsRestart = false;
          runCleanRestart();
        }
      }, 5000); // Wait 5 seconds after build activity stops
    } else if (isBuilding) {
      // Mark that we need a restart when the current build finishes
      needsRestart = true;
    }
  }
};

// Fix problematic modules before starting
fixProblematicModules();

// Start the server
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
    
    // Start watching build directories
    watchBuildDirectories();
    
    console.log('> Auto-restart enabled: Server will restart after builds');
  });
}); 