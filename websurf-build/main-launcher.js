import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const ROOT_DIR = join(__dirname, '..');
const WEBSURF_MCP_DIR = join(ROOT_DIR, 'websurf-mcp');
const WEBSURF_BUILD_DIR = join(ROOT_DIR, 'websurf-build');
const CHROMIUM_DIR = join(WEBSURF_BUILD_DIR, 'chromium');
const DEPS_MARKER = join(WEBSURF_MCP_DIR, '.deps-installed');
const BROWSER_MARKER = join(WEBSURF_BUILD_DIR, '.browser-installed');

console.log('WebSurf MCP Launcher');
console.log('====================\n');

function findChromiumExecutable() {
  // Look for chrome executable in the chromium folder
  const possiblePaths = [
    join(CHROMIUM_DIR, 'chrome.exe'),                    // Windows
    join(CHROMIUM_DIR, 'chrome'),                        // Linux
    join(CHROMIUM_DIR, 'Chromium.app', 'Contents', 'MacOS', 'Chromium'), // macOS
    // Also check nested folders from Playwright download
    join(CHROMIUM_DIR, 'chrome-win', 'chrome.exe'),
    join(CHROMIUM_DIR, 'chrome-linux', 'chrome'),
    join(CHROMIUM_DIR, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      console.log(`>> Found Chromium at: ${path}\n`);
      return path;
    }
  }

  return null;
}

async function checkDependencies() {
  if (existsSync(DEPS_MARKER)) {
    console.log('>> Dependencies already installed');
    return true;
  }
  
  const nodeModulesPath = join(WEBSURF_MCP_DIR, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    console.log('>> Dependencies already installed');
    try {
      writeFileSync(DEPS_MARKER, new Date().toISOString());
    } catch (err) {
      console.warn('WARNING: Could not create marker file:', err.message);
    }
    return true;
  }
  
  return false;
}

async function checkBrowser() {
  // First check if browser executable exists
  const browserPath = findChromiumExecutable();
  if (browserPath) {
    console.log('>> Browser already installed\n');
    // Create marker if it doesn't exist
    if (!existsSync(BROWSER_MARKER)) {
      try {
        writeFileSync(BROWSER_MARKER, new Date().toISOString());
      } catch (err) {
        console.warn('WARNING: Could not create marker file:', err.message);
      }
    }
    return browserPath;
  }
  
  return null;
}

async function installDependencies() {
  console.log('Installing dependencies...');
  console.log('   This may take a few minutes on first launch.\n');
  
  try {
    process.chdir(WEBSURF_MCP_DIR);
    
    console.log('   Installing npm packages...');
    await execAsync('npm install --production', { 
      cwd: WEBSURF_MCP_DIR,
      maxBuffer: 10 * 1024 * 1024
    });
    
    console.log('>> Dependencies installed successfully!\n');
    
    writeFileSync(DEPS_MARKER, new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('ERROR: Failed to install dependencies:');
    console.error(error.message);
    console.error('\nPlease ensure you have Node.js and npm installed.');
    console.error('You can also manually run: cd websurf-mcp && npm install');
    return false;
  }
}

async function installBrowser() {
  console.log('Downloading Chromium browser...');
  console.log('   This is a one-time download (~150MB).\n');
  
  try {
    // Create chromium directory if it doesn't exist
    if (!existsSync(CHROMIUM_DIR)) {
      mkdirSync(CHROMIUM_DIR, { recursive: true });
    }

    // Set environment variable to install browser in our custom location
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: CHROMIUM_DIR
    };

    console.log('   Downloading Chromium to:', CHROMIUM_DIR);
    
    // Install only Chromium browser
    await execAsync('npx playwright install chromium', { 
      cwd: WEBSURF_MCP_DIR,
      env: env,
      maxBuffer: 20 * 1024 * 1024
    });
    
    console.log('>> Browser downloaded successfully!\n');
    
    // Find and return the browser path
    const browserPath = findChromiumExecutable();
    
    if (browserPath) {
      writeFileSync(BROWSER_MARKER, new Date().toISOString());
      return browserPath;
    } else {
      console.warn('WARNING: Browser downloaded but executable not found in expected location.');
      console.warn('   Browser might be in:', CHROMIUM_DIR);
      return null;
    }
    
  } catch (error) {
    console.error('ERROR: Failed to download browser:');
    console.error(error.message);
    console.error('\nYou can manually download by running:');
    console.error(`   set PLAYWRIGHT_BROWSERS_PATH=${CHROMIUM_DIR}`);
    console.error('   cd websurf-mcp && npx playwright install chromium');
    return null;
  }
}

function launchBrowserServer(browserPath) {
  console.log('Starting browser server...');
  
  const browserServerPath = join(WEBSURF_MCP_DIR, 'browser-server.js');
  
  // Set environment variable for the browser path
  const env = {
    ...process.env,
    PLAYWRIGHT_BROWSERS_PATH: CHROMIUM_DIR,
    BROWSER_EXECUTABLE_PATH: browserPath
  };
  
  const browserProcess = spawn('node', [browserServerPath], {
    cwd: WEBSURF_MCP_DIR,
    stdio: 'inherit',
    detached: false,
    env: env
  });
  
  browserProcess.on('error', (error) => {
    console.error('ERROR: Failed to start browser server:', error.message);
  });
  
  return browserProcess;
}

function launchMCPServer() {
  console.log('Starting MCP server...');
  
  const mcpServerPath = join(WEBSURF_MCP_DIR, 'browser-mcp.js');
  
  const mcpProcess = spawn('node', [mcpServerPath], {
    cwd: WEBSURF_MCP_DIR,
    stdio: 'inherit',
    detached: false
  });
  
  mcpProcess.on('error', (error) => {
    console.error('ERROR: Failed to start MCP server:', error.message);
  });
  
  return mcpProcess;
}

async function main() {
  try {
    // Check and install dependencies if needed
    console.log('Checking dependencies...');
    const depsInstalled = await checkDependencies();
    
    if (!depsInstalled) {
      const success = await installDependencies();
      if (!success) {
        process.exit(1);
      }
    }
    
    // Check and install browser if needed
    console.log('Checking browser installation...');
    let browserPath = await checkBrowser();
    
    if (!browserPath) {
      browserPath = await installBrowser();
      if (!browserPath) {
        console.error('ERROR: Could not locate browser executable.');
        console.error('   Please check the chromium folder or install manually.');
        process.exit(1);
      }
    }
    
    console.log('Launching WebSurf MCP...\n');
    
    // Launch browser server first with custom browser path
    const browserProcess = launchBrowserServer(browserPath);
    
    // Wait a moment for browser server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Launch MCP server
    const mcpProcess = launchMCPServer();
    
    console.log('\n>> WebSurf MCP is running!');
    console.log('   Browser: ' + browserPath);
    console.log('   Press Ctrl+C to stop.\n');
    
    // Handle graceful shutdown
    const cleanup = () => {
      console.log('\nShutting down...');
      browserProcess.kill();
      mcpProcess.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    // Keep the process running
    browserProcess.on('exit', (code) => {
      console.error('Browser server exited with code:', code);
      mcpProcess.kill();
      process.exit(code || 1);
    });
    
    mcpProcess.on('exit', (code) => {
      console.error('MCP server exited with code:', code);
      browserProcess.kill();
      process.exit(code || 1);
    });
    
  } catch (error) {
    console.error('ERROR: Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the launcher
main().catch(error => {
  console.error('ERROR: Unexpected error:', error);
  process.exit(1);
});