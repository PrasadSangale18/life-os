#!/usr/bin/env node
const { execSync } = require('child_process');

let failed = false;

// 1. Hardcoded JWT check in src, supabase, .github
try {
  const res = execSync('git grep --no-index -E "eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}" -- src/ supabase/ .github/', { encoding: 'utf8' });
  if (res.trim()) {
    console.error('FAIL: Found hardcoded JWT in src, supabase or .github:');
    console.error(res);
    failed = true;
  }
} catch {}

// 2. Secret role string check anywhere in src, supabase, .github or tracked files
const srTarget = 'service_' + 'role';
try {
  const res = execSync(`git grep --no-index -i "${srTarget}" -- src/ supabase/ .github/`, { encoding: 'utf8' });
  if (res.trim()) {
    console.error(`FAIL: Found "${srTarget}" in src, supabase or .github.`);
    console.error(res);
    failed = true;
  }
} catch {}

try {
  const resTracked = execSync(`git grep -i "${srTarget}"`, { encoding: 'utf8' });
  if (resTracked.trim()) {
    console.error(`FAIL: Found "${srTarget}" in tracked files.`);
    console.error(resTracked);
    failed = true;
  }
} catch {}

// 3. Deprecated Supabase API usage (e.g. auth.user(), auth.session(), auth.signIn())
try {
  const res = execSync('git grep --no-index -E "\\.auth\\.(user|session|signIn)\\(" -- src/', { encoding: 'utf8' });
  if (res.trim()) {
    console.error('FAIL: Found deprecated Supabase API in src/:');
    console.error(res);
    failed = true;
  }
} catch {}

// 4. Forbidden uncommitted files tracked in git (.env, legacy/, import-data/)
try {
  const res = execSync('git ls-files .env', { encoding: 'utf8' });
  if (res.trim()) {
    console.error('FAIL: .env is tracked by git.');
    failed = true;
  }
} catch {}

try {
  const res1 = execSync('git ls-files legacy/', { encoding: 'utf8' });
  if (res1.trim()) {
    console.error('FAIL: legacy/ is tracked by git.');
    failed = true;
  }
} catch {}

try {
  const res2 = execSync('git ls-files import-data/', { encoding: 'utf8' });
  if (res2.trim()) {
    console.error('FAIL: import-data/ is tracked by git.');
    failed = true;
  }
} catch {}

// 5. 12-digit number patterns inside src/ or tests
try {
  const res3 = execSync('git grep -E "\\b[0-9]{12}\\b" -- src/', { encoding: 'utf8' });
  if (res3.trim()) {
    console.error('FAIL: Found 12-digit numbers in src/:');
    console.error(res3);
    failed = true;
  }
} catch {}

if (failed) {
  process.exit(1);
} else {
  console.log('check:safe passed!');
}
