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

console.log(`\n======================================================`);
console.log(` Malwa Namkeen House — Running All Test Suites (${files.length} suites)`);
console.log(`======================================================\n`);

async function checkHealth() {
  try {
    const res = await fetch('http://127.0.0.1:3000/api/health', {
      signal: AbortSignal.timeout(1500),
    });
    return res.status === 200;
  } catch {
    return false;
  }
}

let spawnedProcess = null;

async function ensureServer() {
  const isUp = await checkHealth();
  if (isUp) {
    console.log(`[Test Runner] Live server detected at http://127.0.0.1:3000 (reusing active instance).\n`);
    return;
  }

  console.log(`[Test Runner] No active server detected. Spawning local server for E2E tests...`);
  const serverPath = fs.existsSync(path.resolve('dist/server.cjs'))
    ? path.resolve('dist/server.cjs')
    : path.resolve('server.ts');

  if (serverPath.endsWith('.cjs')) {
    spawnedProcess = spawn('node', [serverPath], {
      stdio: 'ignore',
      cwd: path.resolve('.'),
      env: { ...process.env, CI: 'true', NODE_ENV: 'production' },
    });
  } else {
    spawnedProcess = spawn('npx', ['tsx', serverPath], {
      stdio: 'ignore',
      shell: true,
      cwd: path.resolve('.'),
      env: { ...process.env, CI: 'true', NODE_ENV: 'production' },
    });
  }

  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkHealth()) {
      console.log(`[Test Runner] Live server successfully ready at http://127.0.0.1:3000.\n`);
      return;
    }
  }

  console.warn(`[Test Runner Warning] Server did not become healthy within 30s. Continuing with tests...\n`);
}

function cleanupServer() {
  if (spawnedProcess) {
    console.log(`\n[Test Runner] Cleaning up spawned server process...`);
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
const results = [];

for (const file of files) {
  process.stdout.write(`▶ Running: ${file} ... `);
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
console.log(` Total Suites: ${files.length}`);
console.log(` Passed:       ${passedSuites}`);
console.log(` Failed:       ${failedSuites}`);
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
  console.log(`🎉 ALL ${passedSuites} TEST SUITES PASSED PERFECTLY!\n`);
  process.exit(0);
}
