import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const appPath = resolve(process.argv[2] ?? 'release/mac-arm64/Melodee.app');
await access(appPath);

const run = (command, args) => new Promise((resolvePromise, reject) => {
  const child = spawn(command, args, { stdio: 'inherit' });
  child.once('error', reject);
  child.once('exit', code => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with status ${code}`)));
});

await run('codesign', ['--force', '--deep', '--sign', '-', appPath]);
await run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath]);
console.log(`Ad-hoc signed: ${appPath}`);
