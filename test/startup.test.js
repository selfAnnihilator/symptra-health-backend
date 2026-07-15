const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.resolve(__dirname, '..');

test('the HTTP service stays alive when MongoDB is temporarily unavailable', async (t) => {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: projectRoot,
    env: {
      ...process.env,
      MONGO_URI: '',
      PORT: '0',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    output += chunk.toString();
  });

  t.after(() => {
    if (child.exitCode === null) {
      child.kill('SIGTERM');
    }
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Server did not start:\n${output}`)), 3000);

    const inspectOutput = () => {
      if (output.includes('Server running on port')) {
        clearTimeout(timeout);
        resolve();
      }
    };

    child.stdout.on('data', inspectOutput);
    child.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Server exited during startup with code ${code}:\n${output}`));
    });
  });

  await new Promise((resolve) => setTimeout(resolve, 250));

  assert.equal(child.exitCode, null, output);

  const portMatch = output.match(/Server running on port (\d+)/);
  assert.ok(portMatch, output);
  const port = Number(portMatch[1]);

  const liveResponse = await fetch(`http://127.0.0.1:${port}/health/live`);
  assert.equal(liveResponse.status, 200);
  assert.deepEqual(await liveResponse.json(), { status: 'ok' });

  const apiResponse = await fetch(`http://127.0.0.1:${port}/api/analysis/report`, {
    method: 'POST',
    headers: {
      Origin: 'https://symptra-health-frontend.vercel.app',
    },
  });
  assert.equal(apiResponse.status, 503);
  assert.equal(
    apiResponse.headers.get('access-control-allow-origin'),
    'https://symptra-health-frontend.vercel.app',
  );
  assert.deepEqual(await apiResponse.json(), {
    success: false,
    message: 'Service temporarily unavailable while the database reconnects.',
  });
});
