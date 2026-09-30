import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const testDir = path.resolve('tests');
const files = fs.readdirSync(testDir)
  .filter(f => f.endsWith('.test.ts'))
  .sort();

console.log(`\n======================================================`);
console.log(` Malwa Namkeen House — Running All Test Suites (${files.length} suites)`);
console.log(`======================================================\n`);

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
