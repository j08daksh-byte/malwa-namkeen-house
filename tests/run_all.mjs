import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();
if (fs.existsSync(path.resolve('.env.local'))) {
  dotenv.config({ path: path.resolve('.env.local'), override: true });
}

const testDir = path.resolve('tests');
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.ts'))
  .sort();

const LIVE_E2E_SUITES = ['e2e_live_server.test.ts', 'full_system_e2e.test.ts', 'comprehensive_integration.test.ts', 'webhook_shiprocket.test.ts'];
const hasConfiguredTestDb = Boolean(
  process.env.MONGODB_TEST_URI &&
  process.env.MONGODB_TEST_URI.trim() !== '' &&
  process.env.MONGODB_TEST_DB_NAME &&
  process.env.MONGODB_TEST_DB_NAME.trim() !== '' &&
  process.env.MONGODB_TEST_DB_NAME.trim().toLowerCase() !== (process.env.MONGODB_DB_NAME || 'malwa_namkeen').toLowerCase()
);

console.log(`\n======================================================`);
console.log(` Malwa Namkeen House — Running All Test Suites (${files.length} suites)`);
console.log(` Database Safety Gate: ${hasConfiguredTestDb ? `ACTIVE (Test DB: ${process.env.MONGODB_TEST_DB_NAME})` : 'HARD LOCK (No MONGODB_TEST_URI / MONGODB_TEST_DB_NAME — Live E2E suites protected)'}`);
console.log(`======================================================\n`);

async function checkHealth() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/health', {
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (hasConfiguredTestDb) {
      return data.database === process.env.MONGODB_TEST_DB_NAME;
    }
    return true;
  } catch {
    return false;
  }
}

let spawnedProcess = null;

async function ensureServer() {
  if (!hasConfiguredTestDb) {
    return; // Do not spawn server if test database is not configured
  }

  const isUp = await checkHealth();
  if (isUp) {
    console.log(`[Test Runner] Live server detected at http://127.0.0.1:3000 (connected to test database: "${process.env.MONGODB_TEST_DB_NAME}").\n`);
    return;
  }

  console.log(`[Test Runner] Spawning isolated test server (MONGODB_TEST_DB_NAME=${process.env.MONGODB_TEST_DB_NAME})...`);
  const serverPath = fs.existsSync(path.resolve('dist/server.cjs'))
    ? path.resolve('dist/server.cjs')
    : path.resolve('server.ts');

  const serverEnv = {
    ...process.env,
    CI: 'true',
    NODE_ENV: 'test',
    IS_E2E_TEST: 'true',
    MONGODB_TEST_URI: process.env.MONGODB_TEST_URI,
    MONGODB_TEST_DB_NAME: process.env.MONGODB_TEST_DB_NAME,
    SHIPROCKET_WEBHOOK_TOKEN: process.env.SHIPROCKET_WEBHOOK_TOKEN || 'shiprocket_webhook_secret_daksh_2026',
  };

  if (serverPath.endsWith('.cjs')) {
    spawnedProcess = spawn('node', [serverPath], {
      stdio: 'ignore',
      cwd: path.resolve('.'),
      env: serverEnv,
    });
  } else {
    spawnedProcess = spawn('npx', ['tsx', serverPath], {
      stdio: 'ignore',
      shell: true,
      cwd: path.resolve('.'),
      env: serverEnv,
    });
  }

  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkHealth()) {
      console.log(`[Test Runner] Live test server ready at http://127.0.0.1:3000 (database: "${process.env.MONGODB_TEST_DB_NAME}").\n`);
      return;
    }
  }

  console.warn(`[Test Runner Warning] Test server did not become healthy within 30s. Continuing with tests...\n`);
}

function cleanupServer() {
  if (spawnedProcess) {
    console.log(`\n[Test Runner] Cleaning up spawned test server process...`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${spawnedProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        spawnedProcess.kill('SIGTERM');
      }
    } catch {
      // Ignore cleanup error if process already exited
    }
  }
}

process.on('SIGINT', () => { cleanupServer(); process.exit(1); });
process.on('SIGTERM', () => { cleanupServer(); process.exit(1); });

await ensureServer();

let passedSuites = 0;
let failedSuites = 0;
let skippedSuites = 0;
const results = [];

for (const file of files) {
  process.stdout.write(`▶ Running: ${file} ... `);

  if (LIVE_E2E_SUITES.includes(file) && !hasConfiguredTestDb) {
    console.log(`🔒 SKIPPED (Protected by Hard Safety Gate: MONGODB_TEST_URI / MONGODB_TEST_DB_NAME not configured)`);
    skippedSuites++;
    results.push({ file, status: 'SKIPPED', duration: '0.00' });
    continue;
  }

  const startTime = Date.now();
  try {
    const output = execSync(`npx tsx tests/${file}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CI: 'true' },
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ PASSED (${duration}s)`);
    passedSuites++;
    results.push({ file, status: 'PASSED', duration });
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ FAILED (${duration}s)`);
    failedSuites++;
    results.push({ file, status: 'FAILED', duration, error: err.stderr || err.stdout || err.message });
  }
}

console.log(`\n======================================================`);
console.log(` Test Execution Summary:`);
console.log(` Total Suites:   ${files.length}`);
console.log(` Passed:         ${passedSuites}`);
console.log(` Skipped (Safe): ${skippedSuites}`);
console.log(` Failed:         ${failedSuites}`);
console.log(`======================================================\n`);

cleanupServer();

if (failedSuites > 0) {
  console.log(`Failed Suites Details:`);
  for (const r of results.filter(x => x.status === 'FAILED')) {
    console.log(`\n--- ${r.file} ---`);
    console.log(r.error);
  }
  process.exit(1);
} else {
  console.log(`🎉 ALL VERIFIED TEST SUITES COMPLETED SAFELY!\n`);
  process.exit(0);
}
